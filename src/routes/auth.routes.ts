import { Router } from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
  // logout, changePassword - will be used when authentication middleware is added
} from '../controllers/auth.controller';

const router = Router();

// Public routes (validation happens inside controllers)
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);

// Protected routes (require authentication)
// router.post('/logout', authenticate, logout);
// router.post('/change-password', authenticate, changePassword);

export default router;

