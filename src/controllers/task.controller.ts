import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task from '../models/task.model';
import { isOwnerOrAdmin } from '../middleware/authorize';
import { calculateReminderDate } from '../services/reminder.service';
import {
  createTaskSchema,
  updateTaskSchema,
  getTasksQuerySchema
} from './task.schema';

/**
 * Create a new task
 * POST /api/tasks
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validated = await createTaskSchema.parseAsync({
      body: req.body
    });

    const { title, description, dueDate, priority, reminderType, reminder } = validated.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Calculate reminder date based on reminder type
    let calculatedReminder: Date | undefined;
    const finalReminderType = reminderType || 'custom';

    if (finalReminderType === 'custom' && reminder) {
      // Use custom reminder date
      calculatedReminder = reminder;
    } else if (finalReminderType !== 'custom') {
      // Calculate reminder date based on type (1hour or 1day)
      calculatedReminder = calculateReminderDate(dueDate, finalReminderType);
    }

    // Validate reminder is before or equal to due date
    if (calculatedReminder && calculatedReminder > dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Reminder date must be before or equal to due date'
      });
    }

    // Create task
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority: priority || 'medium',
      reminderType: finalReminderType,
      reminder: calculatedReminder,
      reminderSent: false,
      userId,
      status: 'pending'
    });

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task
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

    console.error('Create task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all tasks for the authenticated user (with filtering and pagination)
 * GET /api/tasks
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    // Validate query parameters
    const validated = await getTasksQuerySchema.parseAsync({
      query: req.query
    });

    const { status, priority, sortBy, sortOrder, page, limit } = validated.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Ensure page and limit have default values (from schema defaults)
    const pageNum = page || 1;
    const limitNum = limit || 10;

    // Build filter object
    const filter: any = { userId };

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Add priority filter if provided
    if (priority) {
      filter.priority = priority;
    }

    // Build sort object
    const sort: any = {};
    sort[sortBy || 'dueDate'] = sortOrder === 'desc' ? -1 : 1;

    // Calculate pagination
    const skip = (pageNum - 1) * limitNum;

    // Get tasks with pagination
    const tasks = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(filter);

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      data: tasks,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
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

    console.error('Get tasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get a single task by ID
 * GET /api/tasks/:id
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user owns the task or is admin
    if (!isOwnerOrAdmin(task.userId.toString(), req)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only access your own tasks'
      });
    }

    return res.status(200).json({
      success: true,
      data: task
    });
  } catch (error: any) {
    console.error('Get task by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a task
 * PUT /api/tasks/:id
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    // Validate request data
    const validated = await updateTaskSchema.parseAsync({
      body: req.body
    });

    const { id } = req.params;
    const userId = req.user?.id;
    const { title, description, dueDate, priority, reminderType, reminder, status } = validated.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user owns the task or is admin
    if (!isOwnerOrAdmin(task.userId.toString(), req)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only update your own tasks'
      });
    }

    // Calculate reminder date if reminderType is provided
    const finalDueDate = dueDate || task.dueDate;
    let calculatedReminder: Date | undefined;

    if (reminderType) {
      if (reminderType === 'custom' && reminder !== undefined) {
        calculatedReminder = reminder || undefined;
      } else if (reminderType !== 'custom') {
        calculatedReminder = calculateReminderDate(finalDueDate, reminderType);
      }
    } else if (reminder !== undefined) {
      // If only reminder is provided (backward compatibility)
      calculatedReminder = reminder || undefined;
    } else {
      // Keep existing reminder if nothing is provided
      calculatedReminder = task.reminder;
    }

    // Validate reminder is before or equal to due date
    if (calculatedReminder && calculatedReminder > finalDueDate) {
      return res.status(400).json({
        success: false,
        message: 'Reminder date must be before or equal to due date'
      });
    }

    // Update task fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (priority !== undefined) task.priority = priority;
    if (reminderType !== undefined) {
      task.reminderType = reminderType;
      task.reminder = calculatedReminder;
      // Reset reminderSent if reminder is changed
      if (calculatedReminder !== task.reminder) {
        task.reminderSent = false;
      }
    } else if (reminder !== undefined) {
      task.reminder = calculatedReminder;
      if (calculatedReminder !== task.reminder) {
        task.reminderSent = false;
      }
    }
    if (status !== undefined) task.status = status;

    await task.save();

    return res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task
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

    console.error('Update task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a task
 * DELETE /api/tasks/:id
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check if user owns the task or is admin
    if (!isOwnerOrAdmin(task.userId.toString(), req)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You can only delete your own tasks'
      });
    }

    await Task.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete task error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get task statistics for the authenticated user
 * GET /api/tasks/stats
 */
export const getTaskStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Convert userId to ObjectId
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Get statistics using aggregation
    const stats = await Task.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get priority distribution
    const priorityStats = await Task.aggregate([
      { $match: { userId: userObjectId } },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get overdue tasks count
    const overdueCount = await Task.countDocuments({
      userId: userObjectId,
      dueDate: { $lt: new Date() },
      status: { $ne: 'completed' }
    });

    // Get upcoming tasks (due in next 7 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 7);
    const upcomingCount = await Task.countDocuments({
      userId: userObjectId,
      dueDate: { $gte: new Date(), $lte: upcomingDate },
      status: { $ne: 'completed' }
    });

    // Format statistics
    const statusStats = {
      pending: 0,
      'in-progress': 0,
      completed: 0
    };

    stats.forEach((stat: any) => {
      statusStats[stat._id as keyof typeof statusStats] = stat.count;
    });

    const priorityDistribution = {
      low: 0,
      medium: 0,
      high: 0
    };

    priorityStats.forEach((stat: any) => {
      priorityDistribution[stat._id as keyof typeof priorityDistribution] = stat.count;
    });

    return res.status(200).json({
      success: true,
      data: {
        status: statusStats,
        priority: priorityDistribution,
        overdue: overdueCount,
        upcoming: upcomingCount
      }
    });
  } catch (error: any) {
    console.error('Get task stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

