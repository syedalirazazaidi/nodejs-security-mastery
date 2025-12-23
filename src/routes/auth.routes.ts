import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
  googleAuth,
  googleCallback,
  enableTwoFactor,
  verifyTwoFactorSetup,
  verifyTwoFactorLogin,
  disableTwoFactor
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes (validation happens inside controllers)
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Google OAuth routes
router.get('/google', googleAuth); // Initiate Google OAuth
router.get('/google/callback', googleCallback); // Google OAuth callback

// 2FA routes
router.post('/verify-2fa-login', verifyTwoFactorLogin); // Verify 2FA during login (public)

// Protected routes (require authentication)
router.post('/change-password', authenticate, changePassword);
router.post('/enable-2fa', authenticate, enableTwoFactor); // Enable 2FA
router.post('/verify-2fa-setup', authenticate, verifyTwoFactorSetup); // Verify 2FA setup
router.post('/disable-2fa', authenticate, disableTwoFactor); // Disable 2FA

export default router;

