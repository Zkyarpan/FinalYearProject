// File: src/db/db.ts - Safe version with minimal changes
import mongoose from 'mongoose';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Availability from '../models/Availability';
import dotenv from 'dotenv';
import Psychologist from '../models/Psychologist';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI ||
  'mongodb+srv://mrarpann22:9uANsNhZMVpbxEU0@mentality.5aunh.mongodb.net/mentality?retryWrites=true&w=majority&appName=mentality';

if (!MONGODB_URI) {
  throw new Error('MONGO_URI is not defined in the environment variables');
}

// Define connection cache type
interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Add to global scope
declare global {
  var mongooseCache: ConnectionCache;
}

// Initialize the connection cache
globalThis.mongooseCache = globalThis.mongooseCache || {
  conn: null,
  promise: null,
};

// Track model initialization status
let modelsInitialized = false;

// Initialize models function - keeping close to your original implementation
async function initializeModels() {
  try {
    if (modelsInitialized) {
      return;
    }

    // Wait for connection to be ready
    await mongoose.connection.asPromise();

    // Initialize all models in order of dependency
    if (!mongoose.models.User) {
      console.log('Initializing User model');
      User;
    }

    if (!mongoose.models.Psychologist) {
      console.log('Initializing Psychologist model');
      Psychologist;
    }

    if (!mongoose.models.Conversation) {
      console.log('Initializing Conversation model');
      Conversation;
    }

    if (!mongoose.models.Message) {
      console.log('Initializing Message model');
      Message;
    }

    if (!mongoose.models.Appointment) {
      console.log('Initializing Appointment model');
      Appointment;
    }

    if (!mongoose.models.Availability) {
      console.log('Initializing Availability model');
      Availability;
    }

    modelsInitialized = true;
    console.log('✅ Models initialized successfully');

  } catch (error) {
    console.error('❌ Error initializing models:', error);
    modelsInitialized = false;
    throw error;
  }
}

// Safe optimization of your database connection logic
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

    console.log('🔄 Creating new MongoDB connection...');

    // Using your original options with slight optimization
    const opts = {
      bufferCommands: true,
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

    // Set up event listeners - keeping your original approach
    mongoose.connection.on('connected', async () => {
      console.log('✅ Successfully connected to MongoDB');
      await initializeModels(); // Initialize models on connection
    });

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
      modelsInitialized = false;
      globalThis.mongooseCache.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❗MongoDB disconnected');
      modelsInitialized = false;
      globalThis.mongooseCache.promise = null;
    });

    // Wait for the connection and model initialization
    await globalThis.mongooseCache.promise;
    globalThis.mongooseCache.conn = mongoose;

    // Make sure models are initialized
    await initializeModels();

    return mongoose;
  } catch (error) {
    globalThis.mongooseCache.promise = null;
    globalThis.mongooseCache.conn = null;
    modelsInitialized = false;
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export default connectDB;