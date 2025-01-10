import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI!;

if (!MONGODB_URI) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

// Define interface for cached connection
interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare global cached connection
declare global {
  var mongooseCache: ConnectionCache;
}

// Initialize cache
globalThis.mongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

const connectDB = async () => {
  try {
    // If we have an existing connection, return it
    if (globalThis.mongooseCache.conn) {
      console.log('✅ Using existing MongoDB connection');
      return globalThis.mongooseCache.conn;
    }

    // If a connection is in progress, wait for it
    if (globalThis.mongooseCache.promise) {
      console.log('⏳ Waiting for existing MongoDB connection promise');
      globalThis.mongooseCache.conn = await globalThis.mongooseCache.promise;
      return globalThis.mongooseCache.conn;
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
      // Add any other options you need
    };

    // Create new connection promise
    globalThis.mongooseCache.promise = mongoose.connect(MONGODB_URI, opts);

    // Set up connection event handlers
    mongoose.connection.on('connected', () => {
      console.log('✅ Successfully connected to MongoDB');
    });

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❗MongoDB disconnected');
    });

    // Handle process termination
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

    // Store the connection
    globalThis.mongooseCache.conn = await globalThis.mongooseCache.promise;

    return globalThis.mongooseCache.conn;
  } catch (error) {
    // Clear the promise on error
    globalThis.mongooseCache.promise = null;
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export default connectDB;
