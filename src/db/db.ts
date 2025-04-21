import mongoose from 'mongoose';
import User from '../models/User';
import Appointment from '../models/Appointment';
import Availability from '../models/Availability';
import dotenv from 'dotenv';
import Psychologist from '../models/Psychologist';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import bcrypt from 'bcryptjs';

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

// Seed default admin user if not exists
async function seedAdmin() {
  const adminEmail = 'admin@mentality.com';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);

    await User.create({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isVerified: true,
    });

    console.log(`✅  Admin user seeded: ${adminEmail}`);
  } else {
    console.log('ℹ️  Admin user already exists.');
  }
}

// Initialize models function
async function initializeModels() {
  try {
    if (modelsInitialized) return;

    await mongoose.connection.asPromise();

    if (!mongoose.models.User) User;
    if (!mongoose.models.Psychologist) Psychologist;
    if (!mongoose.models.Conversation) Conversation;
    if (!mongoose.models.Message) Message;
    if (!mongoose.models.Appointment) Appointment;
    if (!mongoose.models.Availability) Availability;

    modelsInitialized = true;
    console.log('✅ Models initialized successfully');

    // Seed admin after models are ready
    await seedAdmin();
  } catch (error) {
    console.error('❌ Error initializing models:', error);
    modelsInitialized = false;
    throw error;
  }
}

// Connect to database
const connectDB = async (): Promise<typeof mongoose> => {
  try {
    if (mongoose.connections[0].readyState === 1) {
      console.log('✅ Using existing MongoDB connection');
      await initializeModels();
      return mongoose;
    }

    if (globalThis.mongooseCache.promise) {
      console.log('⏳ Waiting for existing MongoDB connection promise');
      await globalThis.mongooseCache.promise;
      await initializeModels();
      return mongoose;
    }

    console.log('🔄 Creating new MongoDB connection...');

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

    globalThis.mongooseCache.promise = mongoose.connect(MONGODB_URI, opts);

    mongoose.connection.on('connected', async () => {
      console.log('✅ Successfully connected to MongoDB');
      await initializeModels();
    });

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB connection error:', err);
      modelsInitialized = false;
      globalThis.mongooseCache.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('❗ MongoDB disconnected');
      modelsInitialized = false;
      globalThis.mongooseCache.promise = null;
    });

    await globalThis.mongooseCache.promise;
    globalThis.mongooseCache.conn = mongoose;

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
