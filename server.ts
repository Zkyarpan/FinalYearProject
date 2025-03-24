import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import connectDB from './src/db/db';
import Message from './src/models/Message';
import Conversation from './src/models/Conversation';
import CallHistory from './src/models/CallHistory';
import mongoose from 'mongoose';
import Notification from './src/models/Notification';
import User from './src/models/User';
import compression from 'compression'; // Add compression
import express from 'express'; // Add express

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

interface ParticipantStatus {
  status: string;
  timestamp: number;
  reason?: string;
}

interface CallData {
  callId: string;
  from: string;
  to: string;
  status: string;
  startTime: Date;
  acceptTime?: Date;
  participantStatus?: Record<string, ParticipantStatus>;
  lastActivity?: number;
  conversationId?: string;
  appointmentId?: string;
  reconnectAttempt?: number;
  reconnectTimestamp?: number;
  callType?: string;
  isRejoinRecovery?: boolean;
}

// Performance optimization: Add size limits to prevent memory leaks
const MAX_CACHE_SIZE = 1000;
const MAX_SIGNAL_CACHE_SIZE = 5000;

// Store for connected users
const connectedUsers = new Map();

// In-memory mapping of user IDs to socket IDs for direct messages
const userSocketMap = new Map();

// Room tracking
const conversationRooms = new Map();
const psychologistRoom = 'psychologists';

// Active calls tracking with enhanced metadata
const activeCalls = new Map();

// Signal caching to prevent duplicates
const recentSignalsCache = new Map();

// Track active ice candidates with improved buffering
const pendingIceCandidates = new Map(); // callId -> array of candidates waiting for peer connection

// Signal handling locks to prevent race conditions
const activeSignalHandling = new Map();

// Track active websocket connections by user
const userConnections = new Map(); // userId -> [socketIds]

// Connection quality metrics
const connectionQualityMetrics = new Map(); // userId -> quality metrics

// Track call setup progress to handle race conditions
const callSetupStatus = new Map(); // callId -> {offerSent, answerReceived, iceCandidatesComplete}

// Performance optimization: Reduce production logging
const log = {
  info: (message, ...args) => {
    if (dev || process.env.LOG_LEVEL === 'info') {
      console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, ...args);
  },
  debug: (message, ...args) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] [${new Date().toISOString()}] ${message}`, ...args);
    }
  },
};

// Performance optimization: Database operation batching
const pendingDbOperations = {
  messages: new Map(),
  notifications: new Map(),
  callHistory: new Map(),
};

let dbBatchTimeout: NodeJS.Timeout | null = null;

// Schedule database operations to run in batches
function scheduleBatchDbOperations() {
  if (dbBatchTimeout) return;

  dbBatchTimeout = setTimeout(async () => {
    try {
      // Process message saves
      if (pendingDbOperations.messages.size > 0) {
        const messages = Array.from(pendingDbOperations.messages.values());
        if (messages.length > 0) {
          await Message.insertMany(messages);
        }
        pendingDbOperations.messages.clear();
      }

      // Process notification saves
      if (pendingDbOperations.notifications.size > 0) {
        const notifications = Array.from(
          pendingDbOperations.notifications.values()
        );
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
        pendingDbOperations.notifications.clear();
      }

      // Process call history saves
      if (pendingDbOperations.callHistory.size > 0) {
        const calls = Array.from(pendingDbOperations.callHistory.values());
        if (calls.length > 0) {
          await CallHistory.insertMany(calls);
        }
        pendingDbOperations.callHistory.clear();
      }
    } catch (error) {
      log.error('Error in batch database operations:', error);
    } finally {
      dbBatchTimeout = null;
    }
  }, 1000); // Batch every 1 second
}

// Utility function to check if a date is valid
function isValidDate(date) {
  return date instanceof Date && !isNaN(date.getTime());
}

// Helper function to format call duration
function formatCallDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} sec`;
  }

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (mins < 60) {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  return `${hours}:${remainingMins.toString().padStart(2, '0')}:${secs
    .toString()
    .padStart(2, '0')}`;
}

// Helper to get socket ID from user ID with better error handling
function getSocketIdForUser(userId) {
  if (!userId) return null;

  const socketId = userSocketMap.get(userId);
  if (!socketId) {
    // Performance optimization: Reduce logging in production
    if (dev) {
      log.warn(`No socket found for user ${userId}`);
    }
    return null;
  }
  return socketId;
}

// Performance optimization: Improve ICE candidate handling
function bufferIceCandidates(callId, from, to, candidate) {
  if (!pendingIceCandidates.has(callId)) {
    pendingIceCandidates.set(callId, []);
  }

  // Limit the number of buffered candidates to prevent memory issues
  const candidates = pendingIceCandidates.get(callId);
  if (candidates.length < 100) {
    // Set reasonable limit
    candidates.push({
      from,
      to,
      candidate,
      timestamp: Date.now(),
    });
  }

  // Performance optimization: Reduce logging in production
  if (dev) {
    log.info(
      `Buffered ICE candidate for call ${callId}, now have ${candidates.length} candidates`
    );
  }
}

// Performance optimization: Better flushing of ICE candidates
function flushCandidates(callId: string, to: string): void {
  if (!pendingIceCandidates.has(callId)) return;

  const candidates = pendingIceCandidates.get(callId) || [];
  const recipientSocketId = getSocketIdForUser(to);

  if (!recipientSocketId) {
    log.warn(
      `Cannot flush ICE candidates for call ${callId} - recipient ${to} not connected`
    );
    return;
  }

  if (dev) {
    log.info(
      `Flushing ${candidates.length} buffered ICE candidates for call ${callId} to ${to}`
    );
  }

  // Performance optimization: Send candidates in batches instead of one by one
  // Group candidates into batches of 10
  const batchSize = 10;
  const candidateBatches: Array<any[]> = [];

  for (let i = 0; i < candidates.length; i += batchSize) {
    candidateBatches.push(candidates.slice(i, i + batchSize));
  }

  // Send batches with a small delay between them
  candidateBatches.forEach((batch, batchIndex) => {
    setTimeout(() => {
      // Extract from property safely
      let fromValue = '';
      if (batch && batch.length > 0 && batch[0]) {
        fromValue = batch[0].from || '';
      }

      io.to(recipientSocketId).emit('ice_candidates_batch', {
        from: fromValue,
        to,
        callId,
        candidates: Array.isArray(batch)
          ? batch.map(item => item && (item.candidate || item))
          : [],
        batchIndex,
        totalBatches: candidateBatches.length,
      });
    }, batchIndex * 100); // Stagger batches by 100ms
  });

  // Clear the buffer after flushing
  pendingIceCandidates.delete(callId);
}
// Fixed graceful shutdown handler
process.on('SIGTERM', () => {
  log.info('SIGTERM signal received, shutting down gracefully');

  // Close the Socket.IO server
  io.close(() => {
    log.info('Socket.IO server closed');

    // Close MongoDB connection - fixed to use correct signature
    mongoose.connection
      .close()
      .then(() => {
        log.info('MongoDB connection closed');
        process.exit(0);
      })
      .catch(err => {
        log.error('Error closing MongoDB connection:', err);
        process.exit(1);
      });
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    log.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
});

// Performance optimization: Improve MongoDB connection
connectDB()
  .then(() => {
    log.info('MongoDB connected successfully');
  })
  .catch(err => {
    log.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });

let io; // Make io variable accessible outside for functions that need it

app
  .prepare()
  .then(() => {
    // Performance optimization: Use Express for middleware support
    const expressApp = express();

    // Performance optimization: Add compression middleware
    expressApp.use(compression());

    // Add static file caching
    expressApp.use(
      '/static',
      express.static('public', {
        maxAge: '7d', // Cache static assets for 7 days
        immutable: true,
      })
    );

    // Handle all requests through Next.js
    expressApp.all('*', (req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    // Use Express app with createServer
    const server = createServer(expressApp);

    // Performance optimization: Improved Socket.IO configuration
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      // Reduced timeouts
      pingTimeout: 30000, // Reduced from 60s to 30s
      pingInterval: 15000, // Reduced from 25s to 15s
      connectTimeout: 20000, // Reduced from 45s to 20s
      maxHttpBufferSize: 1e6, // Reduced from 500MB to 1MB for better memory usage
      transports: ['websocket'], // Prefer websocket only for better performance
      // Add compression
      perMessageDeflate: true,
    });

    // Socket.IO connection handling
    io.on('connection', socket => {
      // Extract user info from socket connection
      const userId =
        socket.handshake.auth.userId || socket.handshake.query.userId;
      const userRole =
        socket.handshake.auth.userRole || socket.handshake.query.userRole;

      if (!userId) {
        log.warn(
          'Connection without userId detected, disconnecting:',
          socket.id
        );
        socket.disconnect(true);
        return;
      }

      // Performance optimization: Reduce logging detail in production
      if (dev) {
        log.info(
          `User connected: ${userId}, role: ${userRole}, socket: ${socket.id}`
        );
      }

      // Track multiple connections for the same user
      if (!userConnections.has(userId)) {
        userConnections.set(userId, new Set());
      }
      userConnections.get(userId).add(socket.id);

      // Handle user login
      socket.on('user_login', userData => {
        const userId = userData._id || userData.id;

        if (!userId) {
          log.warn('User login event received without a user ID');
          return;
        }

        // Performance optimization: Store minimal user data
        connectedUsers.set(socket.id, {
          userId,
          socketId: socket.id,
          userData: {
            firstName: userData.firstName,
            lastName: userData.lastName,
          },
          userRole,
          connectedAt: Date.now(),
        });

        // Map user ID to socket ID for direct messaging
        userSocketMap.set(userId, socket.id);

        // Join a personal room based on user ID for direct messages
        socket.join(userId);

        // If user is a psychologist, add to psychologist room
        if (userRole === 'psychologist') {
          if (dev) {
            log.info(`Psychologist ${userId} joined the psychologist room`);
          }
          socket.join(psychologistRoom);
        }

        if (dev) {
          log.info(`User logged in: ${userId} with socket: ${socket.id}`);
        }

        // Broadcast to all clients with minimal data
        io.emit(
          'users_update',
          Array.from(connectedUsers.values()).map(user => ({
            userId: user.userId,
            socketId: user.socketId,
            userRole: user.userRole,
            firstName: user.userData?.firstName,
            lastName: user.userData?.lastName,
          }))
        );
      });

      // ======= WEBRTC SIGNALING HANDLERS =======

      socket.on('webrtc_signal', async data => {
        try {
          const { type, from, to, signal, callId, callType, conversationId } =
            data;

          // Enhanced logging for debugging in development only
          if (dev) {
            log.info(
              `WebRTC Signal: ${type} from ${from} to ${to}, callId: ${
                callId || 'none'
              }`
            );
          }

          // Validate basic required data
          if (!type || !from || !to) {
            log.error('Invalid WebRTC signal data - missing required fields');
            return;
          }

          // Find recipient's socket ID
          const recipientSocketId = getSocketIdForUser(to);
          if (!recipientSocketId) {
            if (dev) {
              log.warn(`Recipient socket not found for user ${to}`);
            }

            // If recipient is offline and this is an offer, notify caller immediately
            if (type === 'offer') {
              socket.emit('webrtc_signal', {
                type: 'user-unavailable',
                from: to,
                to: from,
                callId: callId || '',
              });
            }
            return;
          }

          // Special handling for different signal types
          if (type === 'offer') {
            if (dev) {
              log.info(
                `New call offer: ${callId} from ${from} to ${to}, type: ${
                  callType || 'video'
                }`
              );
            }

            // Initialize call setup status
            callSetupStatus.set(callId, {
              offerSent: true,
              answerReceived: false,
              iceCandidatesComplete: false,
              connectionChecked: false,
            });

            // Track this call with enhanced metadata
            activeCalls.set(callId, {
              callId,
              from,
              to,
              status: 'ringing',
              startTime: new Date(),
              offerTimestamp: Date.now(),
              callType: callType || 'video',
              conversationId,
              connectionState: 'new',
              mediaTracksAdded: false,
              participantStatus: {},
              lastActivity: Date.now(),
            });

            // Forward the offer immediately
            io.to(recipientSocketId).emit('webrtc_signal', data);

            // Performance optimization: Reduce timeout for unanswered calls
            setTimeout(() => {
              const callData = activeCalls.get(callId);
              if (callData && callData.status === 'ringing') {
                if (dev) {
                  log.warn(`Call ${callId} timed out without answer`);
                }

                // Send missed call signal to caller
                const callerSocketId = getSocketIdForUser(from);
                if (callerSocketId) {
                  io.to(callerSocketId).emit('webrtc_signal', {
                    type: 'call-missed',
                    from: to,
                    to: from,
                    callId,
                  });
                }

                // Performance optimization: Use batch database operations
                pendingDbOperations.callHistory.set(callId, {
                  from,
                  to,
                  fromModel: 'User',
                  toModel: 'User',
                  callType: callType || 'video',
                  duration: 0,
                  status: 'missed',
                  conversationId,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
                scheduleBatchDbOperations();

                // Clean up
                activeCalls.delete(callId);
                pendingIceCandidates.delete(callId);
                callSetupStatus.delete(callId);
              }
            }, 30000); // Performance optimization: Reduced from 45s to 30s
          } else if (type === 'pre-offer') {
            // Special handling for pre-offer to check availability before starting call
            if (dev) {
              log.info(`Pre-offer check from ${from} to ${to}`);
            }

            // Forward to recipient to check if they can accept calls
            io.to(recipientSocketId).emit('webrtc_signal', {
              type: 'pre-offer',
              from,
              to,
              callId: callId || `pre-${Date.now()}`,
              callType: callType || 'video',
            });
          } else if (type === 'pre-offer-answer') {
            // Handle pre-offer response
            if (dev) {
              log.info(
                `Pre-offer answer from ${from} to ${to}: ${data.response}`
              );
            }

            // Forward response to caller
            const callerSocketId = getSocketIdForUser(to);
            if (callerSocketId) {
              io.to(callerSocketId).emit('webrtc_signal', {
                type: 'pre-offer-answer',
                from,
                to,
                callId,
                response: data.response, // can be 'accepted', 'busy', 'rejected'
              });
            }
          } else if (type === 'answer') {
            if (dev) {
              log.info(`Call ${callId} was answered by ${to}`);
            }

            // Update call status
            const callData = activeCalls.get(callId);
            if (callData) {
              callData.status = 'connected';
              callData.acceptTime = new Date();
              callData.connectionState = 'connecting';
              activeCalls.set(callId, callData);

              // Update call setup tracking
              if (callSetupStatus.has(callId)) {
                const status = callSetupStatus.get(callId);
                status.answerReceived = true;
                callSetupStatus.set(callId, status);
              }
            }

            // Forward the answer immediately
            io.to(recipientSocketId).emit('webrtc_signal', data);

            // Flush any buffered ICE candidates after a short delay
            setTimeout(() => {
              flushCandidates(callId, from); // Flush to caller
            }, 300); // Performance optimization: Reduced from 500ms to 300ms
          } else if (type === 'ice-candidate') {
            // Handle and forward ICE candidates with smarter buffering
            const callData = activeCalls.get(callId);

            // Performance optimization: Better ICE candidate handling
            // If call setup is not complete, buffer candidates
            if (callData && callData.status === 'ringing') {
              bufferIceCandidates(callId, from, to, signal);
            } else {
              // Forward ICE candidates immediately
              io.to(recipientSocketId).emit('webrtc_signal', data);
            }
          } else if (type === 'call-state-update') {
            // Handle call state updates
            const { connectionState, mediaState } = data;

            if (dev) {
              log.info(
                `Call ${callId} state update: ${connectionState}, media: ${mediaState}`
              );
            }

            // Update call tracking
            const callData = activeCalls.get(callId);
            if (callData) {
              callData.connectionState =
                connectionState || callData.connectionState;
              if (mediaState === 'tracks-added') {
                callData.mediaTracksAdded = true;
              }
              activeCalls.set(callId, callData);
            }

            // Forward state update to the other party
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } else if (type === 'connection-check') {
            // Verify ICE connectivity
            if (dev) {
              log.info(`Connection check for call ${callId}`);
            }

            // Update call setup status
            if (callSetupStatus.has(callId)) {
              const status = callSetupStatus.get(callId);
              status.connectionChecked = true;
              callSetupStatus.set(callId, status);
            }

            // Forward to other party
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } else if (type === 'call-ended' || type === 'call-rejected') {
            if (dev) {
              log.info(`Call ${callId} was ${type} by ${from}`);
            }

            // Get call data before cleanup
            const callData = activeCalls.get(callId);

            // Handle call history based on status
            if (callData) {
              if (
                type === 'call-ended' &&
                callData.status === 'connected' &&
                callData.acceptTime
              ) {
                // Calculate call duration
                const duration = Math.floor(
                  (new Date().getTime() - callData.acceptTime.getTime()) / 1000
                );

                // Get conversationId with fallback options
                const callConversationId =
                  callData.conversationId || data.conversationId;

                try {
                  // If we still don't have a conversationId, try to find one from previous appointments
                  let finalConversationId = callConversationId;

                  if (!finalConversationId) {
                    if (dev) {
                      log.warn(
                        `Missing conversationId for call ${callId} - attempting to find from appointments`
                      );
                    }

                    // Try to find a conversation between these users
                    try {
                      const existingConversation = await mongoose.connection
                        .collection('conversations')
                        .findOne({
                          $or: [
                            {
                              user: new mongoose.Types.ObjectId(callData.from),
                              psychologist: new mongoose.Types.ObjectId(
                                callData.to
                              ),
                            },
                            {
                              user: new mongoose.Types.ObjectId(callData.to),
                              psychologist: new mongoose.Types.ObjectId(
                                callData.from
                              ),
                            },
                          ],
                        });

                      if (existingConversation) {
                        finalConversationId =
                          existingConversation._id.toString();
                        if (dev) {
                          log.info(
                            `Found existing conversation: ${finalConversationId}`
                          );
                        }
                      } else {
                        // Create a new conversation as fallback
                        const newConversation = {
                          user: callData.from,
                          psychologist: callData.to,
                          createdAt: new Date(),
                          updatedAt: new Date(),
                        };

                        const result = await mongoose.connection
                          .collection('conversations')
                          .insertOne(newConversation);

                        finalConversationId = result.insertedId.toString();
                        if (dev) {
                          log.info(
                            `Created new conversation: ${finalConversationId}`
                          );
                        }
                      }
                    } catch (err) {
                      log.error('Error finding/creating conversation:', err);
                    }
                  }

                  if (finalConversationId) {
                    // Performance optimization: Use batch database operations
                    pendingDbOperations.callHistory.set(callId, {
                      from: callData.from,
                      to: callData.to,
                      fromModel: 'User',
                      toModel: 'User',
                      callType: callData.callType || 'video',
                      duration,
                      status: 'ended',
                      endedAt: new Date(),
                      conversationId: finalConversationId,
                      createdAt: new Date(),
                      updatedAt: new Date(),
                    });
                    scheduleBatchDbOperations();
                  } else {
                    log.error(
                      `Could not save call history - no conversationId available for call ${callId}`
                    );
                  }
                } catch (error) {
                  log.error('Error saving call history:', error);
                }
              }
              // Clean up call tracking
              activeCalls.delete(callId);
              pendingIceCandidates.delete(callId);
              callSetupStatus.delete(callId);
            }

            // Forward the signal to the recipient
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } else if (type === 'media-toggle') {
            // Handle media toggles (mute/unmute, camera on/off)
            if (dev) {
              log.info(
                `Media toggle for call ${callId}: ${data.mediaType} - ${
                  data.enabled ? 'enabled' : 'disabled'
                }`
              );
            }

            // Forward media toggle to the other party
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } else if (type === 'call-reconnect') {
            // Handle reconnection attempt
            if (dev) {
              log.info(`Call reconnection attempt for ${callId}`);
            }

            const callData = activeCalls.get(callId);
            if (callData) {
              callData.reconnecting = true;
              activeCalls.set(callId, callData);
            }

            // Forward to other party
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } // Handle participant-left event
          else if (type === 'participant-left') {
            if (dev) {
              log.info(`Participant ${from} temporarily left call ${callId}`);
            }

            // Do NOT delete the call from activeCalls map - keep it active
            const callData = activeCalls.get(callId) as CallData | undefined;
            if (callData) {
              try {
                // Store more detailed participant status with proper structure
                if (!callData.participantStatus) {
                  callData.participantStatus = {};
                }

                // Update participant status
                callData.participantStatus[from] = {
                  status: 'left_temporarily',
                  timestamp: Date.now(),
                  reason: data.reason || 'unknown',
                };

                // Keep the call active but mark it as waiting
                callData.status = 'waiting';
                callData.lastActivity = Date.now();

                // Store the conversationId explicitly to ensure it's available for reconnection
                if (data.conversationId) {
                  callData.conversationId = data.conversationId;
                }

                // Update the call data in our map
                activeCalls.set(callId, callData);

                if (dev) {
                  log.info(
                    `Call ${callId} marked as 'waiting' with participant ${from} temporarily left`
                  );
                }

                // Set a timeout to clean up the call if it stays inactive too long
                setTimeout(() => {
                  // If the call still exists and the participant hasn't rejoined
                  const currentCallData = activeCalls.get(callId) as
                    | CallData
                    | undefined;
                  if (!currentCallData) {
                    return; // Call no longer exists
                  }

                  // Check if this specific participant is still marked as temporarily left
                  const participantStatus =
                    currentCallData.participantStatus?.[from];
                  if (
                    participantStatus &&
                    participantStatus.status === 'left_temporarily'
                  ) {
                    const timeSinceLeft =
                      Date.now() - (participantStatus.timestamp || 0);
                    const minutesLeft = Math.round(timeSinceLeft / 60000);

                    if (dev) {
                      log.info(
                        `Call ${callId} checking inactive status - participant ${from} left for ${minutesLeft} minutes`
                      );
                    }

                    // Check if all participants are marked as left
                    let allParticipantsLeft = true;
                    let anyParticipantsLeft = false;

                    // Safely check participant statuses
                    if (currentCallData.participantStatus) {
                      const statuses = Object.entries(
                        currentCallData.participantStatus
                      );
                      if (statuses.length > 0) {
                        anyParticipantsLeft = true;

                        // Check if all participants have left temporarily
                        allParticipantsLeft = statuses.every(([_, status]) => {
                          return status && status.status === 'left_temporarily';
                        });
                      }
                    }

                    // Performance optimization: Reduce timeout - 30 min is too long
                    const waitingTimeExceeded = timeSinceLeft > 10 * 60 * 1000; // 10 minutes (reduced from 30)

                    // Clean up if all participants left or waiting time exceeded
                    if (
                      (allParticipantsLeft && anyParticipantsLeft) ||
                      waitingTimeExceeded
                    ) {
                      if (dev) {
                        log.info(
                          `Cleaning up inactive call ${callId} - ${
                            allParticipantsLeft
                              ? 'all participants left'
                              : 'timeout exceeded after ' +
                                minutesLeft +
                                ' minutes'
                          }`
                        );
                      }

                      // Clean up call resources
                      activeCalls.delete(callId);
                      pendingIceCandidates.delete(callId);
                      callSetupStatus.delete(callId);

                      // Notify any connected participants that the call expired
                      if (currentCallData.participantStatus) {
                        Object.keys(currentCallData.participantStatus).forEach(
                          participantId => {
                            const participantSocketId =
                              getSocketIdForUser(participantId);
                            if (participantSocketId) {
                              io.to(participantSocketId).emit('webrtc_signal', {
                                type: 'call-expired',
                                to: participantId,
                                from: 'system',
                                callId,
                                reason: waitingTimeExceeded
                                  ? 'inactivity_timeout'
                                  : 'all_participants_left',
                                message: waitingTimeExceeded
                                  ? 'Call ended due to inactivity'
                                  : 'Call ended because all participants left',
                              });
                            }
                          }
                        );
                      }
                    }
                  }
                }, 10 * 60 * 1000); // Performance optimization: 10 minute timeout (was 30)

                // Forward the temporary leave signal to the other participant
                const recipientSocketId = getSocketIdForUser(to);
                if (recipientSocketId) {
                  io.to(recipientSocketId).emit('webrtc_signal', {
                    type: 'participant-left',
                    from,
                    to,
                    callId,
                    reason: data.reason || 'unknown',
                    message: `Participant ${from} has temporarily left the call and may rejoin.`,
                    timestamp: Date.now(),
                  });
                }
              } catch (error) {
                log.error(
                  `Error handling participant-left for call ${callId}:`,
                  error
                );
              }
            } else {
              log.warn(`Received participant-left for unknown call ${callId}`);
            }
          } else if (type === 'rejoin-call') {
            if (dev) {
              log.info(`User ${from} is rejoining call ${callId}`);
            }

            // Update participant status if the call exists
            const callData = activeCalls.get(callId);
            if (callData) {
              // Update participant status
              callData.participantStatus = {
                ...(callData.participantStatus || {}),
                [from]: 'rejoining', // Mark this participant as actively rejoining (transitional state)
              };

              // Track last activity for timeouts
              callData.lastActivity = Date.now();

              // Update other call properties as needed
              if (callData.status === 'waiting') {
                callData.status = 'reconnecting';
              }

              // Store the reconnection attempt
              callData.reconnectAttempt = (callData.reconnectAttempt || 0) + 1;
              callData.reconnectTimestamp = Date.now();

              activeCalls.set(callId, callData);

              // Clear any buffered candidates that might be stale
              if (pendingIceCandidates.has(callId)) {
                if (dev) {
                  log.info(
                    `Clearing any stale ICE candidates for call ${callId} before rejoin`
                  );
                }
                pendingIceCandidates.delete(callId);
              }

              if (dev) {
                log.info(
                  `Call ${callId} status updated for rejoin, now: ${callData.status}`
                );
              }
            } else {
              // If call data doesn't exist anymore, let the client know
              if (dev) {
                log.warn(
                  `User ${from} tried to rejoin non-existent call ${callId}`
                );
              }
              const callerSocketId = getSocketIdForUser(from);
              if (callerSocketId) {
                io.to(callerSocketId).emit('webrtc_signal', {
                  type: 'call-expired',
                  to: from,
                  from: to,
                  callId: callId,
                });
              }
              return;
            }

            // Forward the rejoin signal to recipient
            const recipientSocketId = getSocketIdForUser(to);
            if (recipientSocketId) {
              io.to(recipientSocketId).emit('webrtc_signal', data);
            }
          } else {
            // For any other signal types, just forward
            io.to(recipientSocketId).emit('webrtc_signal', data);
          }
        } catch (error) {
          log.error('Error processing WebRTC signal:', error);
        }
      });

      // Performance optimization: Combined handler for ICE candidates
      socket.on('ice_candidates_batch', async data => {
        try {
          const { from, to, callId, candidates } = data;

          if (!from || !to || !callId || !candidates || !candidates.length) {
            log.warn('Invalid ICE candidates batch data');
            return;
          }

          const recipientSocketId = getSocketIdForUser(to);
          if (recipientSocketId) {
            // Forward the entire batch at once
            io.to(recipientSocketId).emit('ice_candidates_batch', data);
          } else {
            // Buffer candidates if recipient not connected
            candidates.forEach(candidate => {
              bufferIceCandidates(callId, from, to, candidate);
            });
          }
        } catch (error) {
          log.error('Error processing ICE candidates batch', error);
        }
      });

      // Performance optimization: Enhanced direct ICE handler
      socket.on('direct_ice', data => {
        try {
          const { from, to, candidate, callId } = data;

          if (!to || !candidate) return;

          // Get recipient's socket ID
          const recipientSocketId = getSocketIdForUser(to);
          if (recipientSocketId) {
            // Forward candidate directly without any processing
            socket.to(recipientSocketId).emit('direct_ice', {
              from,
              candidate,
              callId,
              timestamp: Date.now(),
            });
          } else {
            // Buffer candidate if recipient not found
            bufferIceCandidates(callId, from, to, candidate);
          }
        } catch (error) {
          log.error('Error handling direct ICE candidate:', error);
        }
      });

      // Individual ICE candidate handler - for backward compatibility
      socket.on('ice_candidate', async data => {
        try {
          const { from, to, callId, candidate } = data;

          if (!from || !to || !callId || !candidate) return;

          const recipientSocketId = getSocketIdForUser(to);
          if (recipientSocketId) {
            // Forward directly
            io.to(recipientSocketId).emit('ice_candidate', data);
          } else {
            // Buffer the candidate
            bufferIceCandidates(callId, from, to, candidate);
          }
        } catch (error) {
          log.error('Error processing ICE candidate', error);
        }
      });

      // Enhanced connection quality monitoring
      socket.on('connection_quality', data => {
        const { callId, from } = data;
        if (!callId) return;

        // Performance optimization: Limit quality data storage
        // Just forward the quality info without storing
        const callData = activeCalls.get(callId);
        if (callData) {
          const otherParty =
            callData.from === from ? callData.to : callData.from;
          const otherPartySocketId = getSocketIdForUser(otherParty);

          if (otherPartySocketId) {
            io.to(otherPartySocketId).emit('connection_quality', data);
          }
        }
      });

      // Optimize call stats handling by just forwarding
      socket.on('call_stats', data => {
        const { callId, from } = data;
        if (!callId || !from) return;

        // Just forward to the other party without storing
        const callData = activeCalls.get(callId);
        if (callData) {
          const otherParty =
            callData.from === from ? callData.to : callData.from;
          const otherPartySocketId = getSocketIdForUser(otherParty);

          if (otherPartySocketId) {
            io.to(otherPartySocketId).emit('call_stats', data);
          }
        }
      });

      // Save call history to database with optimized approach
      const saveCallHistory = async callData => {
        try {
          const {
            from,
            to,
            callType,
            duration,
            startedAt,
            endedAt,
            status,
            initiator,
            conversationId,
            // Add these defaults
            fromModel = 'User',
            toModel = 'User',
          } = callData;

          // Performance optimization: Use batch database operations
          const callHistoryId = `${from}-${to}-${Date.now()}`;
          pendingDbOperations.callHistory.set(callHistoryId, {
            from,
            to,
            fromModel,
            toModel,
            callType,
            duration,
            startedAt: isValidDate(startedAt)
              ? startedAt
              : new Date(new Date().getTime() - duration * 1000),
            endedAt: isValidDate(endedAt) ? endedAt : new Date(),
            status: status || 'ended',
            initiator: initiator || from,
            conversationId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          scheduleBatchDbOperations();

          // Create call summary message in conversation, but only if the call was completed
          if (conversationId && status === 'ended') {
            try {
              // First check if conversation exists without loading full data
              const conversationExists = await Conversation.exists({
                _id: conversationId,
              });

              if (!conversationExists) {
                log.warn('Could not find conversation for call summary');
                return;
              }

              // Create message content with call details
              const callSymbol = callType === 'video' ? '🎥' : '📞';
              let messageContent = '';

              if (status === 'ended') {
                // Format duration nicely
                const durationText = formatCallDuration(duration);
                messageContent = `${callSymbol} ${callType} call (${durationText})`;
              } else if (status === 'missed') {
                messageContent = `${callSymbol} Missed ${callType} call`;
              } else if (status === 'rejected') {
                messageContent = `${callSymbol} Declined ${callType} call`;
              }

              // Add message to batch operations
              const messageId = `call-${callHistoryId}`;
              pendingDbOperations.messages.set(messageId, {
                conversation: conversationId,
                sender: from,
                receiver: to,
                content: messageContent,
                isRead: true,
                readAt: new Date(),
                messageType: 'call_summary',
                metadata: {
                  callType,
                  duration,
                  status,
                  endedAt,
                  startedAt: isValidDate(startedAt)
                    ? startedAt
                    : new Date(new Date().getTime() - duration * 1000),
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              scheduleBatchDbOperations();

              // Update the conversation's last message - do this in background
              Conversation.findByIdAndUpdate(
                conversationId,
                {
                  // We don't have the message ID yet, so we'll update without it
                  updatedAt: new Date(),
                },
                { new: false }
              ).exec();

              // Send approximate message data to clients immediately for better UX
              const previewMessage = {
                _id: messageId,
                conversation: conversationId,
                sender: { _id: from },
                receiver: { _id: to },
                content: messageContent,
                isRead: true,
                readAt: new Date(),
                messageType: 'call_summary',
                metadata: {
                  callType,
                  duration,
                  status,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                pending: true, // Mark as pending since it's not saved yet
              };

              // Broadcast to conversation room
              const roomName = `conversation:${conversationId}`;
              io.to(roomName).emit('new_message', previewMessage);

              // Also send to individual users
              io.to(from).emit('new_message', previewMessage);
              io.to(to).emit('new_message', previewMessage);

              if (dev) {
                log.info(
                  `Call summary queued for conversation ${conversationId}`
                );
              }
            } catch (error) {
              log.error('Error creating call summary message:', error);
            }
          }
        } catch (error) {
          log.error('Error saving call history:', error);
        }
      };

      // Performance optimization: Optimize online users request
      socket.on('get_online_users', () => {
        // Performance optimization: Send minimal data
        const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
          userId: user.userId,
          socketId: user.socketId,
          userRole: user.userRole,
          firstName: user.userData?.firstName,
          lastName: user.userData?.lastName,
        }));

        socket.emit('users_update', onlineUsers);
      });

      // Enhanced update_availability handler with database notification
      socket.on('update_availability', async data => {
        try {
          const { psychologistId, availabilityData } = data;

          if (!psychologistId) {
            log.warn('Update availability event missing psychologist ID');
            return;
          }

          if (dev) {
            log.info(`Psychologist ${psychologistId} updated availability`);
          }

          // Performance optimization: Load minimal psychologist data
          const psychologist = await User.findById(psychologistId)
            .select('firstName lastName')
            .lean();

          const psychName =
            psychologist && 'firstName' in psychologist
              ? `${psychologist.firstName} ${psychologist.lastName}`
              : 'Your provider';

          // Broadcast to all clients who might be viewing this psychologist's schedule
          io.emit('availability_updated', {
            psychologistId,
            availabilityData,
            timestamp: new Date().toISOString(),
            psychologistName: psychName,
          });

          // Performance optimization: Create self-notification using batch system
          const selfNotificationId = `self-${psychologistId}-${Date.now()}`;
          pendingDbOperations.notifications.set(selfNotificationId, {
            recipient: psychologistId,
            sender: psychologistId, // Self-notification
            type: 'system',
            title: 'Availability Updated',
            content: 'You have successfully updated your availability schedule',
            isRead: false,
            relatedId: null,
            relatedModel: null,
            meta: {
              type: 'availability_self_change',
              timestamp: new Date().toISOString(),
              slots: data?.slots,
              dayRange: data?.dayRange,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          scheduleBatchDbOperations();

          // Performance optimization: Limit database query scope and cache results
          try {
            // Rather than querying all appointments, just get the user IDs
            const activeUserIds = await mongoose.connection
              .collection('appointments')
              .distinct('userId', {
                psychologistId: new mongoose.Types.ObjectId(psychologistId),
                status: { $ne: 'canceled' },
                startTime: { $gt: new Date() },
              });

            // Limit the number of notifications to prevent overload
            const limitedUserIds = activeUserIds.slice(0, 50); // Only notify the first 50 users

            if (dev) {
              log.info(
                `Creating notifications for ${limitedUserIds.length} users about availability update`
              );
            }

            // Create notifications for each user and send socket events
            for (const userId of limitedUserIds) {
              // Performance optimization: Create notification using batch system
              const notificationId = `avail-${psychologistId}-${userId}-${Date.now()}`;
              pendingDbOperations.notifications.set(notificationId, {
                recipient: userId,
                sender: psychologistId,
                type: 'appointment',
                title: `${psychName} Updated Availability`,
                content: `${psychName} has updated their availability schedule. Check for new appointment slots.`,
                isRead: false,
                relatedId: null,
                relatedModel: null,
                meta: {
                  psychologistId,
                  type: 'availability_change',
                  timestamp: new Date().toISOString(),
                  psychologistName: psychName,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
              });

              // Get socket and send notification
              const userSocketId = getSocketIdForUser(userId);
              if (userSocketId) {
                io.to(userSocketId).emit('appointment_notification', {
                  type: 'availability_change',
                  psychologistId,
                  message: `${psychName} has updated their availability`,
                  timestamp: new Date().toISOString(),
                  notificationId, // We don't have the real ID yet
                });
              }
            }

            // Run all database operations
            scheduleBatchDbOperations();
          } catch (error) {
            log.error(
              'Error processing availability update notifications:',
              error
            );
          }
        } catch (error) {
          log.error('Error in update_availability handler:', error);
        }
      });

      interface NotificationData {
        _id: string;
        recipient: string;
        sender: string | null;
        type: string;
        title: string;
        content: string;
        isRead: boolean;
        relatedId: string | null;
        relatedModel: string | null;
        meta: Record<string, any>;
        createdAt: Date;
        updatedAt: Date;
      }

      async function createNotification(
        data
      ): Promise<NotificationData | null> {
        try {
          const {
            recipientId,
            senderId,
            type,
            title,
            content,
            relatedId,
            relatedModel,
            meta,
          } = data;

          // Performance optimization: Use batch database operations
          const notificationId = `${recipientId}-${
            senderId || 'system'
          }-${Date.now()}`;

          pendingDbOperations.notifications.set(notificationId, {
            recipient: recipientId,
            sender: senderId || null,
            type,
            title,
            content,
            isRead: false,
            relatedId: relatedId || null,
            relatedModel: relatedModel || null,
            meta: meta || {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });

          scheduleBatchDbOperations();

          // Return a temporary object with _id
          return {
            _id: notificationId,
            recipient: recipientId,
            sender: senderId || null,
            type,
            title,
            content,
            isRead: false,
            relatedId: relatedId || null,
            relatedModel: relatedModel || null,
            meta: meta || {},
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        } catch (error) {
          log.error('Error creating notification:', error);
          return null;
        }
      }

      socket.on('appointment_booked', async data => {
        try {
          const { appointmentId, psychologistId, userId, appointmentDetails } =
            data;

          if (!appointmentId || !psychologistId || !userId) {
            log.warn('Appointment booked event missing required data');
            return;
          }

          if (dev) {
            log.info(`New appointment booked: ${appointmentId}`);
          }

          // Performance optimization: Load minimal psychologist data
          let psychologist: {
            _id: string;
            firstName: string;
            lastName: string;
            profilePhotoUrl?: string;
          } | null = null;
          try {
            const psychData = (await User.findById(psychologistId)
              .select('_id firstName lastName profilePhotoUrl')
              .lean()) as {
              _id: string;
              firstName: string;
              lastName: string;
              profilePhotoUrl?: string;
            } | null;
            psychologist = psychData;
          } catch (err) {
            log.error('Error fetching psychologist details:', err);
          }

          // Create simplified notification data
          const notificationData = {
            appointmentId,
            appointmentDetails,
            psychologistInfo: {
              id: psychologist ? psychologist._id : psychologistId,
              name: psychologist
                ? `${psychologist.firstName} ${psychologist.lastName}`
                : appointmentDetails.psychologistName || 'Your Provider',
              profilePhoto:
                psychologist && psychologist.profilePhotoUrl
                  ? psychologist.profilePhotoUrl
                  : '',
              specializations: [],
              sessionFee: appointmentDetails.sessionFee,
            },
            dateTime: appointmentDetails.dateTime,
            endTime: appointmentDetails.endTime,
            sessionFormat: appointmentDetails.sessionFormat,
            timestamp: new Date().toISOString(),
          };

          // Create notifications
          let psychNotification: NotificationData | null = null;
          try {
            psychNotification = await createNotification({
              recipientId: psychologistId,
              senderId: userId,
              type: 'appointment',
              title: 'New Appointment Booked',
              content: 'You have a new appointment booked',
              relatedId: appointmentId,
              relatedModel: 'Appointment',
              meta: {
                ...notificationData,
                type: 'new_booking', // This is important for client-side role filtering
              },
            });
          } catch (err) {
            log.error('Error creating psychologist notification:', err);
          }

          let userNotification: NotificationData | null = null;
          try {
            userNotification = await createNotification({
              recipientId: userId,
              senderId: psychologistId,
              type: 'appointment',
              title: 'Appointment Confirmed',
              content: 'Your appointment has been confirmed',
              relatedId: appointmentId,
              relatedModel: 'Appointment',
              meta: {
                ...notificationData,
                type: 'booking_confirmed', // This is important for client-side role filtering
              },
            });
          } catch (err) {
            log.error('Error creating user notification:', err);
          }

          // Notify the psychologist via socket
          const psychologistSocketId = getSocketIdForUser(psychologistId);
          if (psychologistSocketId) {
            try {
              io.to(psychologistSocketId).emit('appointment_notification', {
                type: 'new_booking',
                appointmentId,
                userId,
                details: notificationData,
                message: 'New appointment booked',
                timestamp: new Date().toISOString(),
                notificationId:
                  psychNotification && 'notification' in psychNotification
                    ? (psychNotification as NotificationData)._id
                    : null,
              });

              // Emit notification event
              if (psychNotification) {
                // Skip counting - just estimate
                io.to(psychologistSocketId).emit('new_notification', {
                  notification: psychNotification,
                  unreadCount: 1, // Just show 1 to indicate there are unread notifications
                });
              }
            } catch (err) {
              log.error('Error emitting notification to psychologist:', err);
            }
          }

          // Notify the user via socket
          const userSocketId = getSocketIdForUser(userId);
          if (userSocketId) {
            try {
              io.to(userSocketId).emit('appointment_notification', {
                type: 'booking_confirmed',
                appointmentId,
                psychologistId,
                details: notificationData,
                message: 'Your appointment has been confirmed',
                timestamp: new Date().toISOString(),
                notificationId: userNotification ? userNotification._id : null,
              });

              // Emit notification event
              if (userNotification) {
                // Skip counting - just estimate
                io.to(userSocketId).emit('new_notification', {
                  notification: userNotification,
                  unreadCount: 1, // Just show 1 to indicate there are unread notifications
                });
              }
            } catch (err) {
              log.error('Error emitting notification to user:', err);
            }
          }

          // Broadcast calendar update
          try {
            io.emit('calendar_update', {
              type: 'new_appointment',
              appointmentId,
              psychologistId,
              timestamp: new Date().toISOString(),
            });
          } catch (err) {
            log.error('Error broadcasting calendar update:', err);
          }
        } catch (error) {
          log.error('Error in appointment_booked handler:', error);
        }
      });

      // Optimize get_notifications for performance
      socket.on(
        'get_notifications',
        async (
          { userId, limit = 20, skip = 0, onlyUnread = false },
          callback
        ) => {
          try {
            if (!userId) {
              callback({ success: false, error: 'User ID is required' });
              return;
            }

            const query: { recipient: any; isRead?: boolean } = {
              recipient: userId,
            };
            if (onlyUnread) {
              query.isRead = false;
            }

            // Performance optimization: Use lean() for faster queries
            const notifications = await Notification.find(query)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .select('-__v') // Exclude unnecessary fields
              .populate('sender', 'firstName lastName profilePhotoUrl -_id') // Limit populated fields
              .lean();

            // Performance optimization: Count in parallel with the find
            const countPromise = Notification.countDocuments({
              recipient: userId,
              isRead: false,
            });

            const unreadCount = await countPromise;

            callback({
              success: true,
              notifications,
              unreadCount,
              hasMore: notifications.length === limit,
            });
          } catch (error) {
            log.error('Error fetching notifications:', error);
            callback({
              success: false,
              error: 'Failed to fetch notifications',
            });
          }
        }
      );

      // Optimize mark_notification_read for performance
      socket.on(
        'mark_notification_read',
        async ({ notificationId, userId }, callback) => {
          try {
            if (!notificationId || !userId) {
              callback?.({
                success: false,
                error: 'Notification ID and User ID are required',
              });
              return;
            }

            // Performance optimization: Don't wait for the update
            const updatePromise = Notification.findOneAndUpdate(
              { _id: notificationId, recipient: userId },
              { isRead: true },
              { new: true }
            );

            // Performance optimization: Count in parallel
            const countPromise = Notification.countDocuments({
              recipient: userId,
              isRead: false,
            });

            // Wait for both operations
            const [update, unreadCount] = await Promise.all([
              updatePromise,
              countPromise,
            ]);

            if (!update) {
              callback?.({
                success: false,
                error: 'Notification not found or not authorized',
              });
              return;
            }

            callback?.({ success: true, notification: update });

            // Emit update to socket
            const userSocketId = getSocketIdForUser(userId);
            if (userSocketId) {
              io.to(userSocketId).emit('notification_count_update', {
                unreadCount,
              });
            }
          } catch (error) {
            log.error('Error marking notification as read:', error);
            callback?.({
              success: false,
              error: 'Failed to mark notification as read',
            });
          }
        }
      );

      // Optimize mark_all_notifications_read
      socket.on('mark_all_notifications_read', async ({ userId }, callback) => {
        try {
          if (!userId) {
            callback?.({ success: false, error: 'User ID is required' });
            return;
          }

          // Performance optimization: Just update without waiting
          Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
          ).exec(); // Don't await

          callback?.({
            success: true,
            count: 0, // We don't know the exact count
          });

          // Emit zero count regardless
          const userSocketId = getSocketIdForUser(userId);
          if (userSocketId) {
            io.to(userSocketId).emit('notification_count_update', {
              unreadCount: 0,
            });
          }
        } catch (error) {
          log.error('Error marking all notifications as read:', error);
          callback?.({
            success: false,
            error: 'Failed to mark notifications as read',
          });
        }
      });

      // Performance optimization: Simplify ping handling
      socket.on('ping', data => {
        socket.emit('pong', {
          timestamp: Date.now(),
          serverTime: new Date().toISOString(),
          pingId: data.pingId,
        });
      });

      // ======= CHAT FUNCTIONALITY =======

      // Join a specific conversation room
      socket.on('join_conversation', conversationId => {
        if (!conversationId) {
          return;
        }

        // Leave any other conversation rooms first
        Array.from(socket.rooms).forEach(room => {
          if (
            room !== socket.id &&
            room !== userId &&
            room !== psychologistRoom &&
            typeof room === 'string' &&
            room.startsWith('conversation:')
          ) {
            socket.leave(room);
          }
        });

        const roomName = `conversation:${conversationId}`;
        socket.join(roomName);

        // Keep track of who's in the conversation
        if (!conversationRooms.has(conversationId)) {
          conversationRooms.set(conversationId, new Set());
        }
        conversationRooms.get(conversationId).add(userId);
      });

      // Leave a specific conversation room
      socket.on('leave_conversation', conversationId => {
        if (!conversationId) return;

        const roomName = `conversation:${conversationId}`;
        socket.leave(roomName);

        // Update room tracking
        if (conversationRooms.has(conversationId)) {
          conversationRooms.get(conversationId).delete(userId);
        }
      });

      // Send message handler - optimized
      socket.on('send_message', async messageData => {
        try {
          const { conversationId, content, senderId, receiverId } = messageData;

          // Validate required data
          if (!conversationId || !content || !senderId || !receiverId) {
            socket.emit('message_error', {
              error: 'Missing required message data',
            });
            return;
          }

          if (dev) {
            log.info(
              `Processing message in conversation ${conversationId} from ${senderId} to ${receiverId}`
            );
          }

          try {
            // Performance optimization: Check if conversation exists with minimal query
            const conversationExists = await Conversation.exists({
              _id: conversationId,
            });

            if (!conversationExists) {
              socket.emit('message_error', { error: 'Conversation not found' });
              return;
            }

            // Performance optimization: Create temporary message for immediate display
            const tempMessageId = `${senderId}-${Date.now()}`;
            const tempMessage = {
              _id: tempMessageId,
              conversation: conversationId,
              sender: { _id: senderId },
              receiver: { _id: receiverId },
              content,
              isRead: false,
              readAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
              pending: true, // Mark as pending
            };

            // Broadcast to conversation room immediately
            const roomName = `conversation:${conversationId}`;
            io.to(roomName).emit('new_message', tempMessage);

            // Check if receiver is in room
            const receiverInRoom = io.sockets.adapter.rooms
              .get(roomName)
              ?.has(userSocketMap.get(receiverId));

            // Only send direct notification if receiver is not in the room
            if (!receiverInRoom) {
              io.to(receiverId).emit('message_notification', {
                message: tempMessage,
                conversation: conversationId,
              });
            }

            // Performance optimization: Use batch database operation
            pendingDbOperations.messages.set(tempMessageId, {
              conversation: conversationId,
              sender: senderId,
              receiver: receiverId,
              content,
              isRead: false,
              readAt: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            // Update conversation in background without waiting
            Conversation.findByIdAndUpdate(
              conversationId,
              { updatedAt: new Date() },
              { new: false }
            ).exec();

            // Schedule batch operations
            scheduleBatchDbOperations();
          } catch (error) {
            log.error('Database error when processing message:', error);
            throw error;
          }
        } catch (error) {
          log.error('Error sending message:', error);
          socket.emit('message_error', {
            error: 'Failed to send message',
            details: error.message,
          });
        }
      });

      // Add typing indicator support
      socket.on('typing', ({ conversationId, userId, typing }) => {
        if (!conversationId) return;

        const roomName = `conversation:${conversationId}`;
        socket.to(roomName).emit('user_typing', {
          conversationId,
          userId,
          typing,
        });
      });

      // Enhanced mark read function - optimized
      socket.on('mark_read', async ({ conversationId, userId }) => {
        try {
          if (!conversationId || !userId) {
            return;
          }

          // Performance optimization: Don't wait for database update
          Message.updateMany(
            {
              conversation: conversationId,
              receiver: userId,
              isRead: false,
            },
            {
              isRead: true,
              readAt: new Date(),
            }
          ).exec(); // Don't await

          // Notify conversation room immediately
          const roomName = `conversation:${conversationId}`;
          io.to(roomName).emit('messages_read', {
            conversationId,
            userId,
          });
        } catch (error) {
          log.error('Error marking messages as read:', error);
        }
      });

      // Handle disconnect
      const handleDisconnect = () => {
        // Get user data before removing from maps
        const userData = connectedUsers.get(socket.id);

        if (userData) {
          const userId = userData.userId;

          if (dev) {
            log.info(`User disconnected: ${userId} (${socket.id})`);
          }

          // Update user connections tracking
          if (userConnections.has(userId)) {
            userConnections.get(userId).delete(socket.id);

            // Check if user has other active connections
            const otherConnections = userConnections.get(userId).size;

            if (dev) {
              log.info(
                `User ${userId} has ${otherConnections} remaining connections`
              );
            }

            // If user has other active connections, don't fully disconnect them
            if (otherConnections > 0) {
              // We still need to remove this specific socket, but not the user entirely
              connectedUsers.delete(socket.id);
              return;
            } else {
              // No other connections, remove the user from all tracking
              userConnections.delete(userId);
            }
          }

          // Check for any active calls and mark them as ended
          activeCalls.forEach(async (callData, callId) => {
            if (callData.from === userId || callData.to === userId) {
              if (dev) {
                log.info(`Ending call ${callId} due to user disconnect`);
              }

              // If call was connected, save call history
              if (callData.status === 'connected' && callData.acceptTime) {
                const duration = Math.floor(
                  (new Date().getTime() - callData.acceptTime.getTime()) / 1000
                );

                await saveCallHistory({
                  from: callData.from,
                  to: callData.to,
                  fromModel: 'User',
                  toModel: 'User',
                  callType: callData.callType,
                  duration,
                  endedAt: new Date().toISOString(),
                  status: 'ended',
                  conversationId: callData.conversationId,
                });
              }
              // If call was still ringing, mark as missed
              else if (callData.status === 'ringing') {
                await saveCallHistory({
                  from: callData.from,
                  to: callData.to,
                  fromModel: 'User',
                  toModel: 'User',
                  callType: callData.callType,
                  duration: 0,
                  endedAt: new Date().toISOString(),
                  status: 'missed',
                  conversationId: callData.conversationId,
                });
              }

              // Delete from active calls
              activeCalls.delete(callId);
              pendingIceCandidates.delete(callId);
              callSetupStatus.delete(callId);

              // Notify the other party
              const otherParty =
                callData.from === userId ? callData.to : callData.from;
              const otherPartySocketId = getSocketIdForUser(otherParty);

              if (otherPartySocketId) {
                // Create a unique key for this call-ended signal
                const cacheKey = `call-ended:${callId}:${userId}:${otherParty}`;

                // Only send if not a duplicate
                if (!recentSignalsCache.has(cacheKey)) {
                  recentSignalsCache.set(cacheKey, Date.now());

                  io.to(otherPartySocketId).emit('webrtc_signal', {
                    type: 'call-ended',
                    from: userId,
                    to: otherParty,
                    callId,
                    reason: 'disconnected',
                    conversationId: callData.conversationId,
                  });
                }
              }
            }
          });

          // Clean up any active signal handlers for this user
          for (const [key, value] of activeSignalHandling.entries()) {
            if (key.includes(userId)) {
              clearTimeout(value.timeout);
              activeSignalHandling.delete(key);
            }
          }

          // Remove from maps
          connectedUsers.delete(socket.id);
          userSocketMap.delete(userId);

          // Remove from any conversation rooms
          conversationRooms.forEach((users, roomId) => {
            users.delete(userId);
          });

          // Emit user disconnection event
          io.emit('user_disconnected', {
            userId,
            socketId: socket.id,
          });
        }
      };

      // Basic event handlers stay the same
      socket.on('check_user_online', (userId, callback) => {
        // Check if the user has a socket connection
        const isOnline = userSocketMap.has(userId);
        callback(isOnline);
      });

      socket.on('disconnect', handleDisconnect);
      socket.on('user_logout', handleDisconnect);
    });

    // Performance optimization: More efficient cleanup intervals
    const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

    setInterval(() => {
      const now = Date.now();

      // Clean up stale cache entries
      for (const [key, timestamp] of recentSignalsCache.entries()) {
        // Keep only entries from the last 5 minutes
        if (now - timestamp > 5 * 60 * 1000) {
          recentSignalsCache.delete(key);
        }
      }

      // Clean up old active calls (more aggressive timeout)
      for (const [callId, callData] of activeCalls.entries()) {
        const callAge = now - callData.startTime.getTime();

        // Clean up calls older than 1 hour (reduced from 2 hours)
        if (callAge > 60 * 60 * 1000) {
          log.warn(`Cleaning up stale call: ${callId}`);
          activeCalls.delete(callId);
          pendingIceCandidates.delete(callId);
          callSetupStatus.delete(callId);
        }
      }

      // Performance optimization: Add memory usage monitoring in dev mode
      if (dev) {
        const memoryUsage = process.memoryUsage();
        log.info(
          `Memory usage - RSS: ${Math.round(
            memoryUsage.rss / 1024 / 1024
          )}MB, Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
        );
      }
    }, CLEANUP_INTERVAL);

    process.on('SIGTERM', () => {
      log.info('SIGTERM signal received, shutting down gracefully');

      // Close Socket.IO
      io.close(() => {
        log.info('Socket.IO server closed');

        // Fixed MongoDB connection closing
        mongoose.connection
          .close()
          .then(() => {
            log.info('MongoDB connection closed');
            process.exit(0);
          })
          .catch(err => {
            log.error('Error closing MongoDB connection:', err);
            process.exit(1);
          });
      });

      // Force exit after 10 seconds
      setTimeout(() => {
        log.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    });

    server.listen(port, () => {
      log.info(
        `> Server listening at http://localhost:${port} as ${
          dev ? 'development' : process.env.NODE_ENV
        }`
      );
    });
  })
  .catch(err => {
    log.error('Error starting server:', err);
    process.exit(1);
  });
