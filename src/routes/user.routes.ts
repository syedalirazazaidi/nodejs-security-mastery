import { Router } from 'express';
import {
  getProfile,
  getUserById,
  getAllUsers,
  updateUser,
  deleteUser
} from '../controllers/user.controller';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorize';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get current user's profile (any authenticated user)
router.get('/profile', getProfile);

// Get user by ID (users can access own profile, admins can access any)
router.get('/:id', getUserById);

// Update user (users can update own profile, admins can update any)
router.put('/:id', updateUser);

// Admin only routes
router.get('/', authorize(['admin']), getAllUsers); // Get all users
router.delete('/:id', authorize(['admin']), deleteUser); // Delete user

export default router;

