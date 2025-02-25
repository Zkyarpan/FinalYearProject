import mongoose from 'mongoose';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Availability from '../models/Availability';
import config from '../config/config';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://mrarpann22:9uANsNhZMVpbxEU0@mentality.5aunh.mongodb.net/mentality?retryWrites=true&w=majority&appName=mentality';

if (!MONGODB_URI) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: ConnectionCache;
}

// Initialize the cache
globalThis.mongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

// Initialize models function
async function initializeModels() {
  try {
    // Wait for connection to be ready
    await mongoose.connection.asPromise();

    // Initialize models in order of dependency
    if (!mongoose.models.User) {
      User;
    }
    if (!mongoose.models.Appointment) {
      Appointment;
    }
    if (!mongoose.models.Availability) {
      Availability;
    }
    console.log('✅ Models initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing models:', error);
    throw error;
  }
}

const connectDB = async (): Promise<typeof mongoose> => {
  try {
    // If we have an existing connection, return it
    if (mongoose.connections[0].readyState === 1) {
      console.log('✅ Using existing MongoDB connection');
      await initializeModels(); // Ensure models are initialized
      return mongoose;
    }

    // If we have a pending connection promise, wait for it
    if (globalThis.mongooseCache.promise) {
      console.log('⏳ Waiting for existing MongoDB connection promise');
      await globalThis.mongooseCache.promise;
      await initializeModels(); // Ensure models are initialized
      return mongoose;
    }

    const opts = {
      bufferCommands: true, // Changed to true to allow buffering commands
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
    mongoose.connection.on('connected', async () => {
      console.log('✅ Successfully connected to MongoDB');
      await initializeModels(); // Initialize models on connection
    });

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
      globalThis.mongooseCache.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❗MongoDB disconnected');
      globalThis.mongooseCache.promise = null;
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

    // Wait for the connection and model initialization
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
