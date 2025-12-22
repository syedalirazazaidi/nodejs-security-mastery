import { Request, Response } from 'express';
import User from '../models/user.model';
import { isOwnerOrAdmin } from '../middleware/authorize';

/**
 * Get current user's profile
 * Any authenticated user can access their own profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const user = await User.findById(userId).select('-password -refreshToken -refreshTokenExpires -emailVerificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user by ID
 * Users can only access their own profile, admins can access any profile
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user owns the resource or is admin
    if (!isOwnerOrAdmin(id, req)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access your own profile'
      });
    }

    const user = await User.findById(id).select('-password -refreshToken -refreshTokenExpires -emailVerificationToken -resetPasswordToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    console.error('Get user by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all users
 * Only admins can access this endpoint
 */
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    // This endpoint is protected by authorize(['admin']) middleware
    // So we know user is admin at this point

    const users = await User.find()
      .select('-password -refreshToken -refreshTokenExpires -emailVerificationToken -resetPasswordToken')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error: any) {
    console.error('Get all users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update user
 * Users can update their own profile, admins can update any user
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { name, email } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user owns the resource or is admin
    if (!isOwnerOrAdmin(id, req)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update your own profile'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email && email !== user.email) {
      // If email is changed, require re-verification
      user.email = email;
      user.isEmailVerified = false;
    }

    await user.save();

    // Return updated user without sensitive fields
    const updatedUser = await User.findById(id).select('-password -refreshToken -refreshTokenExpires -emailVerificationToken -resetPasswordToken');

    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete user
 * Only admins can delete users
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Prevent users from deleting themselves (optional safety check)
    if (id === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

