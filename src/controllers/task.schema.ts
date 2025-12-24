import { z } from 'zod';

// Create task schema
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Task title is required')
      .max(200, 'Task title cannot exceed 200 characters')
      .trim(),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .trim()
      .optional(),
    dueDate: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Due date must be a valid date'
      })
      .refine((date) => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: 'Due date cannot be in the past'
      }),
    priority: z
      .enum(['low', 'medium', 'high'], {
        message: 'Priority must be low, medium, or high'
      })
      .default('medium')
      .optional(),
    reminder: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Reminder must be a valid date'
      })
      .optional()
  })
});

// Update task schema
export const updateTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .min(1, 'Task title is required')
      .max(200, 'Task title cannot exceed 200 characters')
      .trim()
      .optional(),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .trim()
      .optional(),
    dueDate: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Due date must be a valid date'
      })
      .optional(),
    priority: z
      .enum(['low', 'medium', 'high'], {
        message: 'Priority must be low, medium, or high'
      })
      .optional(),
    reminder: z
      .union([z.string(), z.date()])
      .transform((val) => (typeof val === 'string' ? new Date(val) : val))
      .refine((date) => !isNaN(date.getTime()), {
        message: 'Reminder must be a valid date'
      })
      .optional()
      .nullable(),
    status: z
      .enum(['pending', 'in-progress', 'completed'], {
        message: 'Status must be pending, in-progress, or completed'
      })
      .optional()
  })
});

// Get tasks query schema (for filtering and pagination)
export const getTasksQuerySchema = z.object({
  query: z.object({
    status: z
      .enum(['pending', 'in-progress', 'completed'], {
        message: 'Status must be pending, in-progress, or completed'
      })
      .optional(),
    priority: z
      .enum(['low', 'medium', 'high'], {
        message: 'Priority must be low, medium, or high'
      })
      .optional(),
    sortBy: z
      .enum(['dueDate', 'priority', 'createdAt', 'updatedAt'], {
        message: 'sortBy must be dueDate, priority, createdAt, or updatedAt'
      })
      .default('dueDate')
      .optional(),
    sortOrder: z
      .enum(['asc', 'desc'], {
        message: 'sortOrder must be asc or desc'
      })
      .default('asc')
      .optional(),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .default('1')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0, { message: 'Page must be greater than 0' })
      .optional(),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .default('10')
      .transform((val) => parseInt(val, 10))
      .refine((val) => val > 0 && val <= 100, { message: 'Limit must be between 1 and 100' })
      .optional()
  })
});

