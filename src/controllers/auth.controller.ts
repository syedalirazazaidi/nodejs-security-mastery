import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/user.model';
import { hashPassword } from '../lib/password';
import { sendVerificationEmail } from '../lib/email';
import { generateToken } from '../lib/jwt';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema
} from './auth.schema';

// Register controller
export const register = async (req: Request, res: Response) => {
  try {
    // Validate request data using schema
    const validated = await registerSchema.parseAsync({
      body: req.body
    });
    
    const { name, email, password } = validated.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      emailVerificationToken,
      emailVerificationExpires
    });
   
    
    // Send verification email
    try {
      await sendVerificationEmail(email, emailVerificationToken, name);
      console.log(`✅ Verification email sent to ${email}`);
    } catch (emailError: any) {
      console.error('❌ Failed to send verification email:', emailError.message);
      // Don't fail registration if email fails, but log the error
      // User can request resend verification email later
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    
    // Return user data with JWT token (without password)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues?.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        })) || []
      });
    }
    
    // Handle duplicate email error (MongoDB)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Login controller
export const login = async (req: Request, res: Response) => {
  try {
    // Validate request data using schema
    const validated = await loginSchema.parseAsync({
      body: req.body
    });
    
    const { email, password: _password } = validated.body;
    
    // TODO: Implement login logic
    // - Find user by email
    // - Compare password
    // - Check if email is verified
    // - Generate JWT token
    // - Return token
    
    return res.status(200).json({
      success: true,
      message: 'Login endpoint - to be implemented',
      data: { email } // Don't send password
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout controller
export const logout = async (_req: Request, res: Response) => {
  try {
    // TODO: Implement logout logic
    return res.status(200).json({
      success: true,
      message: 'Logout endpoint - to be implemented'
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Forgot password controller
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    // Validate request data using schema
    const validated = await forgotPasswordSchema.parseAsync({
      body: req.body
    });
    
    const { email: _email } = validated.body;
    
    // TODO: Implement forgot password logic
    // - Find user by email
    // - Generate reset token
    // - Set resetPasswordToken and resetPasswordExpires
    // - Send reset email
    
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent'
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Reset password controller
export const resetPassword = async (req: Request, res: Response) => {
  try {
    // Validate request data using schema
    const validated = await resetPasswordSchema.parseAsync({
      body: req.body
    });
    
    const { token: _token, password: _password } = validated.body;
    
    // TODO: Implement reset password logic
    // - Find user by resetPasswordToken
    // - Check if token is not expired
    // - Hash new password
    // - Update password
    // - Clear resetPasswordToken and resetPasswordExpires
    // - Increment tokenVersion to invalidate all existing tokens
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change password controller
export const changePassword = async (req: Request, res: Response) => {
  try {
    // Validate request data using schema
    const validated = await changePasswordSchema.parseAsync({
      body: req.body
    });
    
    // User should be authenticated (from auth middleware)
    const { currentPassword: _currentPassword, newPassword: _newPassword } = validated.body;
    // const userId = req.user?.id; // From auth middleware
    
    // TODO: Implement change password logic
    // - Get current user
    // - Verify current password
    // - Hash new password
    // - Update password
    // - Increment tokenVersion to invalidate all existing tokens
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify email controller
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    // Validate request data using schema
    const validated = await verifyEmailSchema.parseAsync({
      body: req.body
    });
    
    const { token } = validated.body;
    
    // Find user by verification token and check if token is not expired
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    }).select('+emailVerificationToken +emailVerificationExpires');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }
    
    // Check if email is already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }
    
    // Verify email
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues?.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        })) || []
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Resend verification email controller
export const resendVerification = async (req: Request, res: Response) => {
  try {
    // Validate request data using schema
    const validated = await resendVerificationSchema.parseAsync({
      body: req.body
    });
    
    const { email: _email } = validated.body;
    
    // TODO: Implement resend verification logic
    // - Find user by email
    // - Check if already verified
    // - Generate new verification token
    // - Send verification email
    
    return res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a verification link has been sent'
    });
  } catch (error: any) {
    // Handle validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

