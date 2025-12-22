import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';

// Load environment variables
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';

// Set NODE_ENV
process.env.NODE_ENV = NODE_ENV;

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Basic route
app.get('/', (_, res) => {
  res.json({ message: 'Server is running!' });
});

// API Routes
app.use('/api/auth', authRoutes);

// Error handling middleware (development: show detailed errors)
if (NODE_ENV === 'development') {
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Error:', err);
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  });
} else {
  app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(500).json({
      error: 'Internal Server Error'
    });
  });
}

export default app;

