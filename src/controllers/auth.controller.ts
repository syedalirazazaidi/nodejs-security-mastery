import { Request, Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model';
import { hashPassword, comparePassword } from '../lib/password';
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/email';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt';
import dotenv from 'dotenv';

dotenv.config();
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema
} from './auth.schema';

// Cookie options helper
const getCookieOptions = () => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  return {
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: NODE_ENV === 'production', // Only send over HTTPS in production
    sameSite: 'strict' as const, // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (for refresh token)
    path: '/' // Available for all routes
  };
};

// Access token cookie options (shorter expiration)
const getAccessTokenCookieOptions = () => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  return {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 15 * 60 * 1000, // 15 minutes (for access token)
    path: '/'
  };
};

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
    
    // Generate Access Token and Refresh Token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    
    // Store refresh token in database
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = refreshTokenExpires;
    await user.save();
    
    // Set tokens in cookies
    res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, getCookieOptions());
    
    // Return user data (tokens are in cookies, but also return in response for flexibility)
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
      accessToken, // Still return for mobile apps/API clients
      refreshToken // Still return for mobile apps/API clients
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
    
    const { email, password } = validated.body;
    
    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google OAuth. Please use Google to sign in.'
      });
    }
    
    // Compare password
    const isPasswordValid = await comparePassword(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if email is verified - REQUIRED for login
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in. Check your inbox for the verification email.',
        error: 'EMAIL_NOT_VERIFIED'
      });
    }
    
    // Generate Access Token and Refresh Token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    
    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    
    // Store refresh token in database
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = refreshTokenExpires;
    await user.save();
    
    // Set tokens in cookies
    res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, getCookieOptions());
    
    // Return user data (tokens are in cookies, but also return in response for flexibility)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      accessToken, // Still return for mobile apps/API clients
      refreshToken // Still return for mobile apps/API clients
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

// Refresh token controller
export const refreshToken = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie or body (for flexibility)
    const token = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }
    
    // Verify refresh token
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Find user and check if refresh token matches
    const user = await User.findById(decoded.userId).select('+refreshToken +refreshTokenExpires');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if refresh token matches and is not expired
    if (user.refreshToken !== token || !user.refreshTokenExpires || user.refreshTokenExpires < new Date()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
    }
    
    // Check token version (for token invalidation)
    if (user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Token has been invalidated. Please login again.'
      });
    }
    
    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });
    
    // Set new access token in cookie
    res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
    
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      accessToken // Still return for mobile apps/API clients
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Logout controller
export const logout = async (req: Request, res: Response) => {
  try {
    // Get refresh token from cookie, body, or header (for flexibility)
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken || req.headers['x-refresh-token'];
    
    if (refreshToken) {
      // Verify and find user
      const decoded = verifyToken(refreshToken as string);
      
      if (decoded) {
        const user = await User.findById(decoded.userId);
        if (user) {
          // Invalidate refresh token in database
          user.refreshToken = undefined;
          user.refreshTokenExpires = undefined;
          await user.save();
        }
      }
    }
    
    // Clear cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    
    return res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
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
    
    const { email } = validated.body;
    
    // Find user by email
    const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');
    
    // Always return success message (security best practice - don't reveal if email exists)
    // But only send email if user exists
    if (user) {
      // Generate password reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();
      
      // Send password reset email
      try {
        await sendPasswordResetEmail(email, resetToken, user.name);
        console.log(`✅ Password reset email sent to ${email}`);
      } catch (emailError: any) {
        console.error('❌ Failed to send password reset email:', emailError.message);
        // Don't fail the request if email fails - user can request again
      }
    }
    
    // Always return success (security: don't reveal if email exists)
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
        errors: error.issues?.map((err: any) => ({
          path: err.path.join('.'),
          message: err.message
        })) || []
      });
    }
    
    console.error('Forgot password error:', error);
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
    
    const { token, password } = validated.body;
    
    // Find user by reset token and check if token is not expired
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Token must not be expired
    }).select('+resetPasswordToken +resetPasswordExpires +password');
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(password);
    
    // Update password
    user.password = hashedPassword;
    
    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    // Increment tokenVersion to invalidate all existing tokens (security measure)
    user.tokenVersion += 1;
    
    // Clear refresh token (force re-login)
    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.'
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
    
    console.error('Reset password error:', error);
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
    
    const { currentPassword, newPassword } = validated.body;
    
    // Get user from authentication middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    
    // Find user with password field
    const user = await User.findById(userId).select('+password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google OAuth. Please use Google to sign in.'
      });
    }
    
    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google OAuth. Please use Google to sign in.'
      });
    }
    
    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Check if new password is different from current password
    const isSamePassword = await comparePassword(newPassword, user.password);
    
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    user.password = hashedPassword;
    
    // Increment tokenVersion to invalidate all existing tokens (security measure)
    user.tokenVersion += 1;
    
    // Clear refresh token (force re-login for security)
    user.refreshToken = undefined;
    user.refreshTokenExpires = undefined;
    
    await user.save();
    
    // Clear cookies (force re-login)
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    
    return res.status(200).json({
      success: true,
      message: 'Password changed successfully. Please login again with your new password.'
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
    
    console.error('Change password error:', error);
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

// Helper function to create Google OAuth client
const createGoogleClient = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback';
  
  if (!clientId || !clientSecret) {
    return null;
  }
  
  return new OAuth2Client(clientId, clientSecret, redirectUri);
};

// Google OAuth - Initiate login
export const googleAuth = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Reload environment variables (in case .env was updated)
    dotenv.config();
    
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      console.error('Google OAuth config check:', {
        GOOGLE_CLIENT_ID: clientId ? `SET (${clientId.substring(0, 20)}...)` : 'NOT SET',
        GOOGLE_CLIENT_SECRET: clientSecret ? 'SET (***)' : 'NOT SET',
        NODE_ENV: process.env.NODE_ENV
      });
      res.status(500).json({
        success: false,
        message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.',
        debug: {
          clientIdSet: !!clientId,
          clientSecretSet: !!clientSecret
        }
      });
      return;
    }

    const googleClient = createGoogleClient();
    
    if (!googleClient) {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize Google OAuth client'
      });
      return;
    }

    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent' // Force consent screen to get refresh token
    });

    res.redirect(authUrl);
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate Google authentication'
    });
    return;
  }
};

// Google OAuth - Callback handler
export const googleCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Authorization code is required')}`);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Google OAuth is not configured')}`);
    }

    const googleClient = createGoogleClient();
    
    if (!googleClient) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Failed to initialize Google OAuth client')}`);
    }

    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);

    if (!tokens.id_token) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Failed to get ID token from Google')}`);
    }

    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: clientId
    });

    const payload = ticket.getPayload();
    
    if (!payload) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Failed to get user information from Google')}`);
    }

    const { sub: googleId, email, name } = payload;

    if (!email) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Email is required from Google account')}`);
    }

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [
        { googleId },
        { email: email.toLowerCase() }
      ]
    });

    if (user) {
      // User exists - update googleId if not set
      if (!user.googleId) {
        user.googleId = googleId;
        user.isEmailVerified = true; // Google emails are verified
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name: name || 'Google User',
        email: email.toLowerCase(),
        googleId,
        isEmailVerified: true, // Google emails are verified
        role: 'user'
      });
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    const refreshToken = generateRefreshToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tokenVersion: user.tokenVersion
    });

    // Store refresh token in database
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    user.refreshToken = refreshToken;
    user.refreshTokenExpires = refreshTokenExpires;
    await user.save();

    // Set tokens in cookies
    res.cookie('accessToken', accessToken, getAccessTokenCookieOptions());
    res.cookie('refreshToken', refreshToken, getCookieOptions());

    // Redirect to frontend with tokens (or return JSON)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`;
    
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error('Google callback error:', error);
    
    // Redirect to frontend with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent('Google authentication failed')}`);
  }
};

