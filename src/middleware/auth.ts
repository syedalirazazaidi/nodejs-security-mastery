import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { verifyToken } from '../lib/jwt';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.accessToken || 
                  req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.'
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
      return;
    }

    // Find user and check token version
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Check if token version matches (for token invalidation)
    if (user.tokenVersion !== decoded.tokenVersion) {
      res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.'
      });
      return;
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource.'
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role
    };

    next();
  } catch (error: any) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
    return;
  }
};

