import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
  // changePassword - will be used when authentication middleware is added
} from '../controllers/auth.controller';

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

// Protected routes (require authentication)
// router.post('/change-password', authenticate, changePassword);

export default router;

