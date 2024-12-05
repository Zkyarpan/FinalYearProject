import mongoose from 'mongoose';
import config from '../config/config.js';

const connectDB = async ()=> {
  try {
    if (mongoose.connection.readyState >= 1) {
      console.log('✅ MongoDB already connected.');
      return;
    }

    mongoose.connection.on('connected', () => {
      console.log('✅ Successfully connected to database.');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    await mongoose.connect(config.databaseUrl);
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    throw error;
  }
};

export default connectDB;
