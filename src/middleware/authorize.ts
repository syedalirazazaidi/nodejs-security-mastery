import { Request, Response, NextFunction } from 'express';

/**
 * Authorization middleware
 * Checks if user has required role(s) to access the resource
 * 
 * @param allowedRoles - Array of roles that are allowed to access
 * @returns Middleware function
 * 
 * @example
 * router.get('/admin/users', authenticate, authorize(['admin']), getUsers);
 * router.put('/users/:id', authenticate, authorize(['admin', 'moderator']), updateUser);
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if user is authenticated (should be set by authenticate middleware)
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource',
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
      return;
    }

    // User has required role, proceed
    next();
  };
};

/**
 * Check if user owns the resource or is admin
 * Useful for resources where users can only access their own data
 * 
 * @param resourceUserId - ID of the resource owner
 * @param req - Express request object
 * @returns True if user owns resource or is admin
 */
export const isOwnerOrAdmin = (resourceUserId: string, req: Request): boolean => {
  if (!req.user) return false;
  
  // Admin can access any resource
  if (req.user.role === 'admin') return true;
  
  // User can only access their own resource
  return req.user.id === resourceUserId;
};

