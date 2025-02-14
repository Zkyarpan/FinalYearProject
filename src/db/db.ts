import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface CleanupResult {
  acknowledged: boolean;
  deletedCount?: number;
  modifiedCount?: number;
  matchedCount?: number;
}

declare global {
  var mongooseCache: ConnectionCache;
}

// Initialize the cache
globalThis.mongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

const logCleanupStatus = (result: CleanupResult) => {
  if (result.deletedCount || result.modifiedCount) {
    console.log(
      `🧹 Cleaned up ${result.modifiedCount || result.deletedCount} past slots`
    );
  }
};

const setupSlotCleanup = () => {
  const cleanupInterval = setInterval(async () => {
    try {
      if (!mongoose.connection.readyState) {
        console.log('❌ No active MongoDB connection for cleanup');
        return;
      }

      const Availability = mongoose.model('Availability');
      const currentDate = new Date();

      const result = await Availability.updateMany(
        {},
        {
          $pull: {
            slots: {
              startTime: { $lt: currentDate },
            },
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `🧹 Cleaned up slots from ${result.modifiedCount} availabilities`
        );
        console.log(`📅 Cleanup time: ${new Date().toLocaleString()}`);
      }
    } catch (error) {
      console.error('❌ Error during slot cleanup:', error);
    }
  }, 60 * 60 * 1000); // Every hour

  // Clean up interval on process termination
  process.on('SIGTERM', () => clearInterval(cleanupInterval));
};

const connectDB = async (): Promise<typeof mongoose> => {
  try {
    // If we have an existing connection, return it
    if (mongoose.connections[0].readyState) {
      console.log('✅ Using existing MongoDB connection');
      return mongoose;
    }

    // If we have a pending connection promise, wait for it
    if (globalThis.mongooseCache.promise) {
      console.log('⏳ Waiting for existing MongoDB connection promise');
      await globalThis.mongooseCache.promise;
      return mongoose;
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      writeConcern: {
        w: 1,
      },
    };

    // Store the connection promise
    globalThis.mongooseCache.promise = mongoose.connect(MONGODB_URI, opts);

    // Set up event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Successfully connected to MongoDB');
      console.log('🔄 Setting up automatic slot cleanup...');
      setupSlotCleanup();
    });

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
      globalThis.mongooseCache.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❗MongoDB disconnected');
      globalThis.mongooseCache.promise = null;
    });

    mongoose.connection.on('cleanup-completed', (result: CleanupResult) => {
      logCleanupStatus(result);
    });

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    // Wait for the connection
    await globalThis.mongooseCache.promise;
    globalThis.mongooseCache.conn = mongoose;

    return mongoose;
  } catch (error) {
    globalThis.mongooseCache.promise = null;
    globalThis.mongooseCache.conn = null;
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export default connectDB;
