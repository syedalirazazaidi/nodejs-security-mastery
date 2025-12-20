import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
const NODE_ENV = process.env.NODE_ENV || 'development';

// MongoDB Connection
export const connectDB = async (): Promise<void> => {
  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    const mongooseOptions = {
      dbName: 'node-mystery' // Specify database name
      // Development: show more detailed logs
      // Production: minimal logging
    };

    await mongoose.connect(MONGODB_URI, mongooseOptions);
    console.log('✅ MongoDB connected successfully ');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1); // Exit process if connection fails
  }
};

// Mongoose connection event handlers
mongoose.connection.on('disconnected', () => {
  if (NODE_ENV === 'development') {
    console.log('⚠️  MongoDB disconnected -- -- ');
  }
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

