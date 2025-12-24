import http from 'http';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import app from './app';
import { startReminderCronJob } from './services/reminder.service';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server
const server = http.createServer(app);

// Start server and connect to database
const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📦 Environment: ${NODE_ENV}`);
      
      // Start reminder cron job
      startReminderCronJob();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
