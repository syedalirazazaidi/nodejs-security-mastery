import { Router } from 'express';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTaskStats
} from '../controllers/task.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Task routes
router.post('/', createTask); // Create a new task
router.get('/', getTasks); // Get all tasks (with filtering and pagination)
router.get('/stats', getTaskStats); // Get task statistics
router.get('/:id', getTaskById); // Get a single task by ID
router.put('/:id', updateTask); // Update a task
router.delete('/:id', deleteTask); // Delete a task

export default router;

