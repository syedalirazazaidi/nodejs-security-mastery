import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '15m'; // Access token: 15 minutes
const REFRESH_TOKEN_EXPIRES_IN: string | number = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // Refresh token: 7 days

// JWT payload interface
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  tokenVersion: number;
}

/**
 * Generate Access Token (short-lived)
 * @param payload - JWT payload (userId, email, role, tokenVersion)
 * @returns JWT access token string
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * Generate Refresh Token (long-lived)
 * @param payload - JWT payload (userId, email, role, tokenVersion)
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined');
  }
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  } as jwt.SignOptions);
};

/**
 * Generate JWT token (alias for backward compatibility)
 * @param payload - JWT payload (userId, email, role, tokenVersion)
 * @returns JWT token string
 */
export const generateToken = (payload: JWTPayload): string => {
  return generateAccessToken(payload);
};

/**
 * Verify JWT token
 * @param token - JWT token string
 * @returns Decoded token payload or null if invalid
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Decode JWT token without verification (for debugging)
 * @param token - JWT token string
 * @returns Decoded token payload or null
 */
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwt.decode(token) as JWTPayload;
  } catch (error) {
    return null;
  }
};

