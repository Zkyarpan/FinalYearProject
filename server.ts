import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import connectDB from './src/db/db';
import Message from './src/models/Message';
import Conversation from './src/models/Conversation';
import CallHistory from './src/models/CallHistory';
import { getStatusChangeMessage } from './src/helpers/getStatusChangeMessage';
import mongoose from 'mongoose';
import Notification from './src/models/Notification';
import User from './src/models/User';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

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

// Enhanced logging with timestamps
const log = {
  info: (message, ...args) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, ...args);
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
    log.warn(`No socket found for user ${userId}`);
    return null;
  }
  return socketId;
}

// Improved version to buffer ICE candidates if connection not ready
function bufferIceCandidates(callId, from, to, candidate) {
  if (!pendingIceCandidates.has(callId)) {
    pendingIceCandidates.set(callId, []);
  }

  pendingIceCandidates.get(callId).push({
    from,
    to,
    candidate,
    timestamp: Date.now(),
  });

  log.info(
    `Buffered ICE candidate for call ${callId}, now have ${
      pendingIceCandidates.get(callId).length
    } candidates`
  );
}

// Flush buffered candidates when appropriate
function flushCandidates(callId, to) {
  if (!pendingIceCandidates.has(callId)) return;

  const candidates = pendingIceCandidates.get(callId);
  const recipientSocketId = getSocketIdForUser(to);

  if (!recipientSocketId) {
    log.warn(
      `Cannot flush ICE candidates for call ${callId} - recipient ${to} not connected`
    );
    return;
  }

  log.info(
    `Flushing ${candidates.length} buffered ICE candidates for call ${callId} to ${to}`
  );

  candidates.forEach((candidateData, index) => {
    // Add a small delay between candidates to avoid overwhelming
    setTimeout(() => {
      io.to(recipientSocketId).emit('webrtc_signal', {
        type: 'ice-candidate',
        from: candidateData.from,
        to: candidateData.to,
        callId,
        signal: candidateData.candidate,
        buffered: true,
        batchIndex: index,
        batchSize: candidates.length,
      });
    }, index * 50); // Small staggered delay
  });

  // Clear the buffer after flushing
  pendingIceCandidates.delete(callId);
}

// Connect to MongoDB at server start
connectDB().catch(err => {
  log.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

let io; // Make io variable accessible outside for functions that need it

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url!, true);
      handle(req, res, parsedUrl);
    });

    // Initialize Socket.IO with improved connection settings for WebRTC
    io = new Server(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      pingTimeout: 60000, // 1 minute ping timeout
      pingInterval: 25000, // Send ping every 25 seconds
      connectTimeout: 45000, // 45 second connection timeout
      maxHttpBufferSize: 5e8, // 500 MB max buffer size for large media transfers
      transports: ['websocket', 'polling'], // Prefer websocket but allow polling as fallback
    });

    // Socket.IO connection handling
    io.on('connection', socket => {
      // log.info('New client connected', socket.id);

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

      log.info(
        `User connected: ${userId}, role: ${userRole}, socket: ${socket.id}`
      );

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

        // Store user data with socket ID
        connectedUsers.set(socket.id, {
          userId,
          socketId: socket.id,
          userData,
          userRole,
          connectedAt: new Date().toISOString(),
        });

        // Map user ID to socket ID for direct messaging
        userSocketMap.set(userId, socket.id);

        // Join a personal room based on user ID for direct messages
        socket.join(userId);

        // If user is a psychologist, add to psychologist room
        if (userRole === 'psychologist') {
          log.info(`Psychologist ${userId} joined the psychologist room`);
          socket.join(psychologistRoom);
        }

        log.info(`User logged in: ${userId} with socket: ${socket.id}`);

        // Broadcast to all clients
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

      // ======= ENHANCED WEBRTC SIGNALING HANDLERS =======

      socket.on('webrtc_signal', async data => {
        try {
          const { type, from, to, signal, callId, callType, conversationId } =
            data;

          // Enhanced logging for debugging
          log.info(
            `WebRTC Signal: ${type} from ${from} to ${to}, callId: ${
              callId || 'none'
            }`
          );

          // Validate basic required data
          if (!type || !from || !to) {
            log.error('Invalid WebRTC signal data - missing required fields');
            return;
          }

          // Find recipient's socket ID
          const recipientSocketId = getSocketIdForUser(to);
          if (!recipientSocketId) {
            log.warn(`Recipient socket not found for user ${to}`);

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
            log.info(
              `New call offer: ${callId} from ${from} to ${to}, type: ${
                callType || 'video'
              }`
            );

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
            });

            // Forward the offer immediately
            io.to(recipientSocketId).emit('webrtc_signal', data);

            // Set auto-timeout for unanswered calls - shorter timeout for better UX
            setTimeout(() => {
              const callData = activeCalls.get(callId);
              if (callData && callData.status === 'ringing') {
                log.warn(`Call ${callId} timed out without answer`);

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

                // Log a missed call in history
                saveCallHistory({
                  from,
                  to,
                  fromModel: 'User', // Using default model
                  toModel: 'User', // Using default model
                  callType: callType || 'video',
                  duration: 0,
                  status: 'missed',
                  conversationId,
                });

                // Clean up
                activeCalls.delete(callId);
                pendingIceCandidates.delete(callId);
                callSetupStatus.delete(callId);
              }
            }, 45000); // 45 second timeout (reduced from 60s)
          } else if (type === 'pre-offer') {
            // Special handling for pre-offer to check availability before starting call
            log.info(`Pre-offer check from ${from} to ${to}`);

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
            log.info(
              `Pre-offer answer from ${from} to ${to}: ${data.response}`
            );

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
            log.info(`Call ${callId} was answered by ${to}`);

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
            }, 500);
          } else if (type === 'ice-candidate') {
            // Handle and forward ICE candidates with smarter buffering
            const callData = activeCalls.get(callId);

            // If call setup is not complete, buffer candidates
            if (callData && callData.status === 'ringing') {
              bufferIceCandidates(callId, from, to, signal);
            } else {
              // Forward ICE candidates immediately
              io.to(recipientSocketId).emit('webrtc_signal', data);
            }
          } else if (type === 'call-state-update') {
            // Handle call state updates (new in this implementation)
            const { connectionState, mediaState } = data;

            log.info(
              `Call ${callId} state update: ${connectionState}, media: ${mediaState}`
            );

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
            // New event type to verify ICE connectivity
            log.info(`Connection check for call ${callId}`);

            // Update call setup status
            if (callSetupStatus.has(callId)) {
              const status = callSetupStatus.get(callId);
              status.connectionChecked = true;
              callSetupStatus.set(callId, status);
            }

            // Forward to other party
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } else if (type === 'call-ended' || type === 'call-rejected') {
            log.info(`Call ${callId} was ${type} by ${from}`);

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
                const callConversationId =
                  callData.conversationId || data.conversationId;

                if (!callConversationId) {
                  log.warn(
                    `Missing conversationId for call ${callId} - call history may be incomplete`
                  );
                }

                try {
                  await saveCallHistory({
                    from: callData.from,
                    to: callData.to,
                    fromModel: 'User', // Using default model
                    toModel: 'User', // Using default model
                    callType: callData.callType || 'video',
                    duration,
                    status: 'ended',
                    endedAt: new Date().toISOString(),
                    conversationId: callConversationId, // Use the value we verified
                  });
                } catch (error) {
                  log.error('Error saving call history:', error);
                }
              } else if (type === 'call-rejected') {
                const callConversationId =
                  callData.conversationId || data.conversationId;
                try {
                  await saveCallHistory({
                    from: callData.from,
                    to: callData.to,
                    fromModel: 'User',
                    toModel: 'User',
                    callType: callData.callType || 'video',
                    duration: 0,
                    status: 'rejected',
                    endedAt: new Date().toISOString(),
                    conversationId: callConversationId,
                  });
                } catch (error) {
                  log.error('Error saving rejected call history:', error);
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
            log.info(
              `Media toggle for call ${callId}: ${data.mediaType} - ${
                data.enabled ? 'enabled' : 'disabled'
              }`
            );

            // Forward media toggle to the other party
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } else if (type === 'call-reconnect') {
            // Handle reconnection attempt
            log.info(`Call reconnection attempt for ${callId}`);

            const callData = activeCalls.get(callId);
            if (callData) {
              callData.reconnecting = true;
              activeCalls.set(callId, callData);
            }

            // Forward to other party
            io.to(recipientSocketId).emit('webrtc_signal', data);
          } else {
            // For any other signal types, just forward
            io.to(recipientSocketId).emit('webrtc_signal', data);
          }
        } catch (error) {
          log.error('Error processing WebRTC signal:', error);
        }
      });

      // Enhanced direct ICE handler with less buffering for faster exchange
      socket.on('direct_ice', data => {
        try {
          const { from, to, candidate, callId } = data;

          if (!to || !candidate) {
            return;
          }

          // Get recipient's socket ID
          const recipientSocketId = getSocketIdForUser(to);
          if (recipientSocketId) {
            // Forward candidate directly without any processing
            socket.to(recipientSocketId).emit('direct_ice', {
              from,
              candidate,
              callId,
              timestamp: Date.now(), // Add timestamp for tracking
            });
          } else {
            // Buffer candidate if recipient not found
            bufferIceCandidates(callId, from, to, candidate);
          }
        } catch (error) {
          log.error('Error handling direct ICE candidate:', error);
        }
      });

      // Dedicated endpoint for ICE candidate batches (more efficient)
      socket.on('ice_candidates_batch', async data => {
        try {
          const { from, to, callId, candidates } = data;

          if (!from || !to || !callId || !candidates || !candidates.length) {
            log.warn('Invalid ICE candidates batch data');
            return;
          }

          const recipientSocketId = getSocketIdForUser(to);
          if (recipientSocketId) {
            // Forward the entire batch
            io.to(recipientSocketId).emit('ice_candidates_batch', data);
            log.debug(
              `ICE candidate batch (${candidates.length}) forwarded from ${from} to ${to}`
            );
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

      // Improved individual ICE candidate handler
      socket.on('ice_candidate', async data => {
        try {
          const { from, to, callId, candidate } = data;

          if (!from || !to || !callId || !candidate) {
            log.warn('Invalid ICE candidate data');
            return;
          }

          const recipientSocketId = getSocketIdForUser(to);
          if (recipientSocketId) {
            // Forward directly without any processing or caching
            io.to(recipientSocketId).emit('ice_candidate', data);
            log.debug(`ICE candidate forwarded from ${from} to ${to}`);
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
        try {
          const { callId, quality, metrics } = data;

          if (!callId) return;

          // Store quality data
          if (!connectionQualityMetrics.has(callId)) {
            connectionQualityMetrics.set(callId, []);
          }

          connectionQualityMetrics.get(callId).push({
            timestamp: Date.now(),
            quality,
            metrics,
          });

          // Forward quality info to the other call participant
          const callData = activeCalls.get(callId);
          if (callData) {
            const otherParty =
              callData.from === data.from ? callData.to : callData.from;
            const otherPartySocketId = getSocketIdForUser(otherParty);

            if (otherPartySocketId) {
              io.to(otherPartySocketId).emit('connection_quality', data);
            }
          }
        } catch (error) {
          log.error('Error processing connection quality data', error);
        }
      });

      // Enhanced call statistics monitoring
      socket.on('call_stats', data => {
        try {
          const { callId, from, stats } = data;

          if (!callId || !from || !stats) return;

          // Process and store stats
          // Forward stats to other participant
          const callData = activeCalls.get(callId);
          if (callData) {
            const otherParty =
              callData.from === from ? callData.to : callData.from;
            const otherPartySocketId = getSocketIdForUser(otherParty);

            if (otherPartySocketId) {
              io.to(otherPartySocketId).emit('call_stats', data);
            }
          }
        } catch (error) {
          log.error('Error processing call stats:', error);
        }
      });

      // Request for ICE candidates if some were missed
      socket.on('request_ice_candidates', data => {
        try {
          const { callId, from, to } = data;

          if (!callId || !from || !to) return;

          log.info(`${from} requested ICE candidates for call ${callId}`);

          // Check if we have stored ICE candidates for this call
          if (pendingIceCandidates.has(callId)) {
            // Flush candidates
            flushCandidates(callId, to);
          } else {
            // Send notification to other party to resend their candidates
            const otherPartySocketId = getSocketIdForUser(to);
            if (otherPartySocketId) {
              io.to(otherPartySocketId).emit('webrtc_signal', {
                type: 'resend-candidates',
                from,
                to,
                callId,
              });
            }
          }
        } catch (error) {
          log.error('Error resending ICE candidates', error);
        }
      });

      // Advanced call quality monitoring
      socket.on('call_metrics', data => {
        try {
          const { callId, from, metrics } = data;

          if (!callId || !from || !metrics) {
            log.warn('Incomplete call metrics received:', data);
            return;
          }

          // Store metrics for analysis
          if (!connectionQualityMetrics.has(callId)) {
            connectionQualityMetrics.set(callId, []);
          }

          connectionQualityMetrics.get(callId).push({
            timestamp: Date.now(),
            from,
            metrics,
          });

          // Log severe quality issues
          if (metrics.packetsLost > 50 || metrics.jitter > 100) {
            log.warn(
              `Poor call quality detected for ${callId}: loss=${metrics.packetsLost}, jitter=${metrics.jitter}`
            );
          }

          // Forward metrics to the other party for display
          const callData = activeCalls.get(callId);
          if (callData) {
            const otherParty =
              callData.from === from ? callData.to : callData.from;
            const otherPartySocketId = getSocketIdForUser(otherParty);

            if (otherPartySocketId) {
              io.to(otherPartySocketId).emit('call_metrics', data);
            }
          }
        } catch (error) {
          log.error('Error processing call metrics:', error);
        }
      });

      // Comprehensive call summary handling
      socket.on('call_summary', async data => {
        try {
          const {
            from,
            to,
            callType,
            duration,
            endedAt: clientEndedAt,
            status,
            conversationId,
            // Add these defaults
            fromModel = 'User',
            toModel = 'User',
          } = data;

          if (
            !from ||
            !to ||
            !callType ||
            duration === undefined ||
            !conversationId
          ) {
            log.warn('Call summary missing required data:', data);
            return;
          }

          log.info(
            `Call summary: ${status} ${callType} call between ${from} and ${to}, duration: ${duration}s`
          );

          // Validate dates and create valid ones if needed
          const endedAt = isValidDate(new Date(clientEndedAt))
            ? new Date(clientEndedAt)
            : new Date();

          const startedAt = new Date(endedAt.getTime() - duration * 1000);

          // Create data object with valid dates
          const callData = {
            ...data,
            fromModel,
            toModel,
            endedAt,
            startedAt,
          };

          // Save to call history with validated dates
          await saveCallHistory(callData);

          // Clean up any call metrics
          if (connectionQualityMetrics.has(data.callId)) {
            connectionQualityMetrics.delete(data.callId);
          }
        } catch (error) {
          log.error('Error saving call summary:', error);
        }
      });

      // Save call history to database
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

          // Create call history record with the required model fields
          const callHistory = new CallHistory({
            from,
            to,
            fromModel, // This is the required field that was missing
            toModel, // This is the required field that was missing
            callType,
            duration,
            startedAt: isValidDate(startedAt)
              ? startedAt
              : new Date(new Date().getTime() - duration * 1000),
            endedAt: isValidDate(endedAt) ? endedAt : new Date(),
            status: status || 'ended',
            initiator: initiator || from,
            conversationId,
          });

          await callHistory.save();
          log.info('Call history saved successfully');

          // Create call summary message in conversation
          if (conversationId) {
            try {
              let conversation = await Conversation.findById(conversationId);

              if (!conversation) {
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

              // Create a message for the call
              const callSummaryMessage = new Message({
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
              });

              await callSummaryMessage.save();

              // Update the conversation's last message
              await Conversation.findByIdAndUpdate(conversationId, {
                lastMessage: callSummaryMessage._id,
                updatedAt: new Date(),
              });

              // Get populated message to broadcast
              const populatedMessage = await Message.findById(
                callSummaryMessage._id
              )
                .populate(
                  'sender',
                  '_id firstName lastName email image profilePhotoUrl role'
                )
                .populate(
                  'receiver',
                  '_id firstName lastName email image profilePhotoUrl role'
                );

              // Broadcast to conversation room
              const roomName = `conversation:${conversationId}`;
              io.to(roomName).emit('new_message', populatedMessage);

              // Also send to individual users
              io.to(from).emit('new_message', populatedMessage);
              io.to(to).emit('new_message', populatedMessage);

              log.info(`Call summary added to conversation ${conversationId}`);
            } catch (error) {
              log.error('Error creating call summary message:', error);
            }
          }
        } catch (error) {
          log.error('Error saving call history:', error);
          // Just log the error but don't throw it further - prevents call failures
        }
      };

      // Handle client requests for online users
      socket.on('get_online_users', () => {
        const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
          userId: user.userId,
          socketId: user.socketId,
          userRole: user.userRole,
          firstName: user.userData?.firstName,
          lastName: user.userData?.lastName,
        }));

        socket.emit('users_update', onlineUsers);
        log.info(
          `Sent online users list to ${socket.id}, count: ${onlineUsers.length}`
        );
      });

      socket.on('update_availability', async data => {
        try {
          const { psychologistId, availabilityData } = data;

          if (!psychologistId) {
            log.warn('Update availability event missing psychologist ID');
            return;
          }

          log.info(`Psychologist ${psychologistId} updated availability`);

          // Find the psychologist to get their name for the notification
          const psychologist = await User.findById(psychologistId).select(
            'firstName lastName'
          );
          const psychName = psychologist
            ? `${psychologist.firstName} ${psychologist.lastName}`
            : 'Your provider';

          // Broadcast to all clients who might be viewing this psychologist's schedule
          io.emit('availability_updated', {
            psychologistId,
            availabilityData,
            timestamp: new Date().toISOString(),
            psychologistName: psychName,
          });

          // Find all users who have appointments with this psychologist
          try {
            // Include users who have recently viewed this psychologist's profile
            // This gives better notification coverage
            const appointments = await mongoose.connection
              .collection('appointments')
              .find({
                psychologistId: new mongoose.Types.ObjectId(psychologistId),
                status: { $ne: 'canceled' }, // Only for active appointments
                startTime: { $gt: new Date() }, // Only for future appointments
              })
              .toArray();

            // Collect unique user IDs
            const userIdsFromAppointments = appointments.map(apt =>
              apt.userId.toString()
            );

            // Also get users who have booked with this psychologist in the past
            const pastAppointments = await mongoose.connection
              .collection('appointments')
              .find({
                psychologistId: new mongoose.Types.ObjectId(psychologistId),
                $and: [
                  { startTime: { $lt: new Date() } }, // Past appointments
                  // Limit to last 3 months for relevance
                  {
                    startTime: {
                      $gt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
                    },
                  },
                ],
              })
              .toArray();

            const userIdsFromPastAppointments = pastAppointments.map(apt =>
              apt.userId.toString()
            );

            // Combine all user IDs and remove duplicates
            const userIds = [
              ...new Set([
                ...userIdsFromAppointments,
                ...userIdsFromPastAppointments,
              ]),
            ];

            log.info(
              `Creating notifications for ${userIds.length} users about availability update`
            );

            // Create notifications for each user and send socket events
            for (const userId of userIds) {
              // Create database notification with a unique title that won't be filtered
              const notification = new Notification({
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
              });

              await notification.save();
              log.info(
                `Created notification ${notification._id} for user ${userId}`
              );

              // Send targeted socket notifications to these users
              const userSocketId = getSocketIdForUser(userId);
              if (userSocketId) {
                io.to(userSocketId).emit('appointment_notification', {
                  type: 'availability_change',
                  psychologistId,
                  message: `${psychName} has updated their availability`,
                  timestamp: new Date().toISOString(),
                  notificationId: notification._id,
                });

                // Also emit a more general notification event
                io.to(userSocketId).emit('new_notification', {
                  notification: notification.toObject(),
                  unreadCount: await Notification.countDocuments({
                    recipient: userId,
                    isRead: false,
                  }),
                });
              }
            }
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

      async function createNotification(data) {
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

          const notification = new Notification({
            recipient: recipientId,
            sender: senderId || null,
            type,
            title,
            content,
            isRead: false,
            relatedId: relatedId || null,
            relatedModel: relatedModel || null,
            meta: meta || {},
          });

          await notification.save();
          log.info(
            `Notification created: ${notification._id} for user ${recipientId}`
          );
          return notification;
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

          log.info(`New appointment booked: ${appointmentId}`);

          // Create notification for psychologist in database
          const psychNotification = await createNotification({
            recipientId: psychologistId,
            senderId: userId,
            type: 'appointment',
            title: 'New Appointment Booked',
            content: 'You have a new appointment booked',
            relatedId: appointmentId,
            relatedModel: 'Appointment',
            meta: {
              appointmentDetails,
              type: 'new_booking',
            },
          });

          // Create notification for patient in database
          const userNotification = await createNotification({
            recipientId: userId,
            senderId: psychologistId,
            type: 'appointment',
            title: 'Appointment Confirmed',
            content: 'Your appointment has been confirmed',
            relatedId: appointmentId,
            relatedModel: 'Appointment',
            meta: {
              appointmentDetails,
              type: 'booking_confirmed',
            },
          });

          // Notify the psychologist via socket
          const psychologistSocketId = getSocketIdForUser(psychologistId);
          if (psychologistSocketId) {
            io.to(psychologistSocketId).emit('appointment_notification', {
              type: 'new_booking',
              appointmentId,
              userId,
              details: appointmentDetails,
              message: 'New appointment booked',
              timestamp: new Date().toISOString(),
              notificationId: psychNotification?._id,
            });
          }

          // Notify the user via socket
          const userSocketId = getSocketIdForUser(userId);
          if (userSocketId) {
            io.to(userSocketId).emit('appointment_notification', {
              type: 'booking_confirmed',
              appointmentId,
              psychologistId,
              details: appointmentDetails,
              message: 'Your appointment has been confirmed',
              timestamp: new Date().toISOString(),
              notificationId: userNotification?._id,
            });
          }

          // Broadcast calendar update to all relevant parties
          io.emit('calendar_update', {
            type: 'new_appointment',
            appointmentId,
            psychologistId,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          log.error('Error in appointment_booked handler:', error);
        }
      });

      socket.on('update_availability', async data => {
        const selfNotification = new Notification({
          recipient: data.psychologistId,
          sender: data.psychologistId, // Self-notification
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
        });

        await selfNotification.save();
        log.info(
          `Created self-notification for psychologist ${data.psychologistId}`
        );

        // Send socket notification to the psychologist
        const psychologistSocketId = getSocketIdForUser(data.psychologistId);
        if (psychologistSocketId) {
          io.to(psychologistSocketId).emit('appointment_notification', {
            type: 'availability_self_change',
            message: 'You have successfully updated your availability schedule',
            timestamp: new Date().toISOString(),
            notificationId: selfNotification._id,
          });

          // Also emit a more general notification event
          io.to(psychologistSocketId).emit('new_notification', {
            notification: selfNotification.toObject(),
            unreadCount: await Notification.countDocuments({
              recipient: data.psychologistId,
              isRead: false,
            }),
          });
        }
      });

      // Enhanced update_availability handler with database notification
      socket.on('update_availability', async data => {
        try {
          const { psychologistId, availabilityData } = data;

          if (!psychologistId) {
            log.warn('Update availability event missing psychologist ID');
            return;
          }

          log.info(`Psychologist ${psychologistId} updated availability`);

          // Find the psychologist to get their name for the notification
          const psychologist = await User.findById(psychologistId).select(
            'firstName lastName'
          );
          const psychName = psychologist
            ? `${psychologist.firstName} ${psychologist.lastName}`
            : 'Your provider';

          // Broadcast to all clients who might be viewing this psychologist's schedule
          io.emit('availability_updated', {
            psychologistId,
            availabilityData,
            timestamp: new Date().toISOString(),
            psychologistName: psychName,
          });

          // Find all users who have appointments with this psychologist and send targeted notifications
          try {
            // Fetch from database all users with appointments for this psychologist
            const appointments = await mongoose.connection
              .collection('appointments')
              .find({
                psychologistId: new mongoose.Types.ObjectId(psychologistId),
                status: { $ne: 'canceled' }, // Only for active appointments
                startTime: { $gt: new Date() }, // Only for future appointments
              })
              .toArray();

            const userIds = [
              ...new Set(appointments.map(apt => apt.userId.toString())),
            ];

            // Create notifications for each user and send socket events
            for (const userId of userIds) {
              // Create database notification
              const notification = await createNotification({
                recipientId: userId,
                senderId: psychologistId,
                type: 'appointment',
                title: 'Availability Updated',
                content: `${psychName} has updated their availability`,
                relatedId: null,
                relatedModel: null,
                meta: {
                  psychologistId,
                  type: 'availability_change',
                  timestamp: new Date().toISOString(),
                },
              });

              // Send targeted socket notifications to these users
              const userSocketId = getSocketIdForUser(userId);
              if (userSocketId) {
                io.to(userSocketId).emit('appointment_notification', {
                  type: 'availability_change',
                  psychologistId,
                  message: `${psychName} has updated their availability`,
                  timestamp: new Date().toISOString(),
                  notificationId: notification?._id,
                });
              }
            }
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

      // Add a route to get notifications from the database
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

            const notifications = await Notification.find(query)
              .sort({ createdAt: -1 })
              .skip(skip)
              .limit(limit)
              .populate('sender', 'firstName lastName profilePhotoUrl')
              .lean();

            const unreadCount = await Notification.countDocuments({
              recipient: userId,
              isRead: false,
            });

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

      // Add a route to mark notifications as read
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

            const update = await Notification.findOneAndUpdate(
              { _id: notificationId, recipient: userId },
              { isRead: true },
              { new: true }
            );

            if (!update) {
              callback?.({
                success: false,
                error: 'Notification not found or not authorized',
              });
              return;
            }

            callback?.({ success: true, notification: update });

            // Emit an event to update badge counts
            const userSocketId = getSocketIdForUser(userId);
            if (userSocketId) {
              const unreadCount = await Notification.countDocuments({
                recipient: userId,
                isRead: false,
              });

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

      // Add a route to mark all notifications as read
      socket.on('mark_all_notifications_read', async ({ userId }, callback) => {
        try {
          if (!userId) {
            callback?.({ success: false, error: 'User ID is required' });
            return;
          }

          const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { isRead: true }
          );

          callback?.({
            success: true,
            count: result.modifiedCount,
          });

          // Emit an event to update badge counts
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

      // Handle ping to keep connection alive
      socket.on('ping', data => {
        // Response with pong
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
          log.warn('Join conversation event received without conversation ID');
          return;
        }

        // Leave any other conversation rooms first
        Array.from(socket.rooms).forEach(room => {
          if (
            room !== socket.id &&
            room !== userId &&
            room !== psychologistRoom
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

        log.info(
          `Socket ${socket.id} (user ${userId}) joined conversation: ${conversationId}`
        );
        log.info(
          `Room ${roomName} now has ${
            io.sockets.adapter.rooms.get(roomName)?.size || 0
          } members`
        );
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

        log.info(
          `Socket ${socket.id} (user ${userId}) left conversation: ${conversationId}`
        );
      });

      // Join psychologist room
      socket.on('join_psychologist_room', () => {
        if (userRole === 'psychologist') {
          socket.join(psychologistRoom);
          log.info(`Psychologist ${userId} joined the psychologist room`);
        }
      });

      // Leave psychologist room
      socket.on('leave_psychologist_room', () => {
        socket.leave(psychologistRoom);
        log.info(`User ${userId} left the psychologist room`);
      });

      // Send message handler
      socket.on('send_message', async messageData => {
        try {
          const { conversationId, content, senderId, receiverId } = messageData;

          // Validate required data
          if (!conversationId || !content || !senderId || !receiverId) {
            log.warn(`Missing data in message: ${JSON.stringify(messageData)}`);
            socket.emit('message_error', {
              error: 'Missing required message data',
            });
            return;
          }

          log.info(
            `Processing message in conversation ${conversationId} from ${senderId} to ${receiverId}`
          );

          try {
            // Find conversation and verify it exists
            const conversation = await Conversation.findById(conversationId)
              .populate('user', '_id firstName lastName email image role')
              .populate(
                'psychologist',
                '_id firstName lastName email profilePhotoUrl role'
              );

            if (!conversation) {
              log.warn(`Conversation not found: ${conversationId}`);
              socket.emit('message_error', { error: 'Conversation not found' });
              return;
            }

            // Create message in database
            const newMessage = new Message({
              conversation: conversationId,
              sender: senderId,
              receiver: receiverId,
              content,
              isRead: false,
              readAt: null,
            });

            await newMessage.save();
            log.info(`Message saved to database with ID: ${newMessage._id}`);

            // Update the conversation's last message
            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: newMessage._id,
              updatedAt: new Date(), // Force update the updatedAt timestamp
            });

            // Get populated message to broadcast
            const populatedMessage = await Message.findById(newMessage._id)
              .populate(
                'sender',
                '_id firstName lastName email image profilePhotoUrl role'
              )
              .populate(
                'receiver',
                '_id firstName lastName email image profilePhotoUrl role'
              );

            // Ensure the message has proper sender information
            const enhancedMessage = {
              ...populatedMessage.toObject(),
              sender: populatedMessage.sender || {
                _id: senderId,
                firstName:
                  conversation.user._id.toString() === senderId
                    ? conversation.user.firstName
                    : conversation.psychologist.firstName,
                lastName:
                  conversation.user._id.toString() === senderId
                    ? conversation.user.lastName
                    : conversation.psychologist.lastName,
                email:
                  conversation.user._id.toString() === senderId
                    ? conversation.user.email
                    : conversation.psychologist.email,
                image:
                  conversation.user._id.toString() === senderId
                    ? conversation.user.image
                    : conversation.psychologist.profilePhotoUrl,
                role:
                  conversation.user._id.toString() === senderId
                    ? 'user'
                    : 'psychologist',
              },
            };

            // SIMPLIFIED NOTIFICATION STRATEGY to avoid duplicates
            const roomName = `conversation:${conversationId}`;

            // 1. Broadcast to conversation room
            io.to(roomName).emit('new_message', enhancedMessage);

            // 2. Check if the receiver is in the conversation room
            const receiverInRoom = io.sockets.adapter.rooms
              .get(roomName)
              ?.has(userSocketMap.get(receiverId));

            // 3. Only send direct notification if receiver is not in the room
            if (!receiverInRoom) {
              io.to(receiverId).emit('message_notification', {
                message: enhancedMessage,
                conversation: conversationId,
              });
            }

            log.info(`Message processing complete for ID: ${newMessage._id}`);
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

      // Enhanced mark read function
      socket.on('mark_read', async ({ conversationId, userId }) => {
        try {
          if (!conversationId || !userId) {
            log.warn('Mark read event missing data:', {
              conversationId,
              userId,
            });
            return;
          }

          log.info(
            `Marking messages as read in conversation ${conversationId} for user ${userId}`
          );

          try {
            // Update all unread messages in this conversation sent to this user
            const result = await Message.updateMany(
              {
                conversation: conversationId,
                receiver: userId,
                isRead: false,
              },
              {
                isRead: true,
                readAt: new Date(),
              }
            );

            log.info(`Updated ${result.modifiedCount} messages as read`);

            // Notify conversation room that messages have been read
            const roomName = `conversation:${conversationId}`;
            io.to(roomName).emit('messages_read', {
              conversationId,
              userId,
            });

            // Also notify senders directly
            const messages = await Message.find({
              conversation: conversationId,
              receiver: userId,
              isRead: true,
            }).select('sender');

            const senderIds = [
              ...new Set(messages.map(msg => msg.sender.toString())),
            ];

            senderIds.forEach(senderId => {
              const senderSocketId = getSocketIdForUser(senderId);
              if (senderSocketId) {
                io.to(senderSocketId).emit('messages_read', {
                  conversationId,
                  userId,
                });
              }
            });
          } catch (error) {
            log.error('Database error when marking messages as read:', error);
            throw error;
          }
        } catch (error) {
          log.error('Error marking messages as read:', error);
        }
      });

      // Handle explicit user logout
      socket.on('user_logout', () => {
        handleDisconnect();
      });

      // ======= ENHANCED VIDEO CALL HELPERS =======

      // New endpoint to check if a user can receive calls
      socket.on('check_call_availability', async (targetUserId, callback) => {
        try {
          const targetSocketId = getSocketIdForUser(targetUserId);

          if (!targetSocketId) {
            // User is offline
            callback({ available: false, reason: 'offline' });
            return;
          }

          // Check if user is in an active call
          let userInCall = false;

          for (const [, callData] of activeCalls.entries()) {
            if (
              callData.from === targetUserId ||
              callData.to === targetUserId
            ) {
              if (
                callData.status === 'connected' ||
                callData.status === 'ringing'
              ) {
                userInCall = true;
                break;
              }
            }
          }

          if (userInCall) {
            callback({ available: false, reason: 'busy' });
            return;
          }

          // If not in a call, they should be available
          callback({ available: true });
        } catch (error) {
          log.error('Error checking call availability:', error);
          callback({ available: false, reason: 'error' });
        }
      });

      // New endpoint to get device capabilities
      socket.on('report_device_capabilities', capabilities => {
        try {
          // Store device capabilities with user
          if (connectedUsers.has(socket.id)) {
            const userData = connectedUsers.get(socket.id);
            userData.deviceCapabilities = capabilities;
            connectedUsers.set(socket.id, userData);

            log.info(
              `Updated device capabilities for user ${
                userData.userId
              }: ${JSON.stringify(capabilities)}`
            );
          }
        } catch (error) {
          log.error('Error storing device capabilities:', error);
        }
      });

      // Handle disconnect
      const handleDisconnect = () => {
        // Get user data before removing from maps
        const userData = connectedUsers.get(socket.id);

        if (userData) {
          const userId = userData.userId;
          log.info(`User disconnected: ${userId} (${socket.id})`);

          // Update user connections tracking
          if (userConnections.has(userId)) {
            userConnections.get(userId).delete(socket.id);

            // Check if user has other active connections
            const otherConnections = userConnections.get(userId).size;
            log.info(
              `User ${userId} has ${otherConnections} remaining connections`
            );

            // If user has other active connections, don't fully disconnect them
            if (otherConnections > 0) {
              // We still need to remove this specific socket, but not the user entirely
              connectedUsers.delete(socket.id);

              // Don't update userSocketMap if user has other connections
              // This ensures messages still route to their active sessions

              return;
            } else {
              // No other connections, remove the user from all tracking
              userConnections.delete(userId);
            }
          }

          // Check for any active calls and mark them as ended
          activeCalls.forEach(async (callData, callId) => {
            if (callData.from === userId || callData.to === userId) {
              log.info(`Ending call ${callId} due to user disconnect`);

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
                  recentSignalsCache.set(cacheKey, true);

                  io.to(otherPartySocketId).emit('webrtc_signal', {
                    type: 'call-ended',
                    from: userId,
                    to: otherParty,
                    callId,
                    reason: 'disconnected',
                    conversationId: callData.conversationId,
                  });

                  // Expire cache entry after 5 seconds
                  setTimeout(() => {
                    recentSignalsCache.delete(cacheKey);
                  }, 5000);
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

          // Broadcast updated user list
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
        }
      };

      // Add a handler for checking if a user is online
      socket.on('check_user_online', (userId, callback) => {
        // Check if the user has a socket connection
        const isOnline = userSocketMap.has(userId);
        log.debug(`Checking if user ${userId} is online: ${isOnline}`);
        callback(isOnline);
      });

      // Handler for getting user info
      socket.on('get_user_info', (userId, callback) => {
        log.info(`Getting info for user: ${userId}`);

        // Find the user in the connected users map
        let userInfo: {
          userId: string;
          firstName: string;
          lastName: string;
          role?: string;
        } | null = null;
        for (const [, user] of connectedUsers.entries()) {
          if (user.userId === userId) {
            userInfo = {
              userId: user.userId,
              firstName: user.userData?.firstName || 'User',
              lastName: user.userData?.lastName || '',
              role: user.userRole,
            };
            break;
          }
        }

        // If user info wasn't found in connected users, try to get minimal info
        if (!userInfo) {
          userInfo = {
            userId,
            firstName: 'User',
            lastName: '',
          };
        }

        log.debug(`Returning user info:`, userInfo);
        callback(userInfo);
      });

      // Add a heartbeat mechanism to keep WebRTC connections alive
      setInterval(() => {
        const onlineUsers = Array.from(connectedUsers.values()).map(user => ({
          userId: user.userId,
          socketId: user.socketId,
        }));

        // Send a heartbeat to all connected clients to keep NAT mappings alive
        if (onlineUsers.length > 0) {
          io.emit('heartbeat', {
            timestamp: Date.now(),
            serverTime: new Date().toISOString(),
          });
        }
      }, 20000);

      socket.on('disconnect', () => {
        handleDisconnect();
      });
    });

    // Periodic cleanup of stale data
    setInterval(() => {
      const now = Date.now();

      // Clean up any call-ended signal caches older than 5 minutes
      let cacheCleanupCount = 0;
      for (const [key, timestamp] of recentSignalsCache.entries()) {
        if (now - timestamp > 300000) {
          // 5 minutes
          recentSignalsCache.delete(key);
          cacheCleanupCount++;
        }
      }

      if (cacheCleanupCount > 0) {
        log.info(`Cleaned up ${cacheCleanupCount} stale cache entries`);
      }

      // Clean up any active calls that are more than 2 hours old (likely abandoned)
      let callCleanupCount = 0;
      for (const [callId, callData] of activeCalls.entries()) {
        const callAge = now - callData.startTime.getTime();
        if (callAge > 7200000) {
          // 2 hours
          log.warn(
            `Cleaning up stale call: ${callId}, age: ${Math.floor(
              callAge / 60000
            )} minutes`
          );
          activeCalls.delete(callId);
          pendingIceCandidates.delete(callId);
          callSetupStatus.delete(callId);
          callCleanupCount++;
        }
      }

      if (callCleanupCount > 0) {
        log.info(`Cleaned up ${callCleanupCount} stale call records`);
      }
    }, 600000); // Run every 10 minutes

    server.listen(port, () => {
      log.info(
        `> Server listening at http://localhost:${port} as ${
          dev ? 'development' : process.env.NODE_ENV
        }`
      );
      log.info('> Socket.IO server initialized.');
    });
  })
  .catch(err => {
    log.error('Error starting server:', err);
    process.exit(1);
  });
