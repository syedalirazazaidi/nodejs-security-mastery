import mongoose, { Schema, Document, Types } from 'mongoose';

// Task interface
export interface ITask extends Document {
  title: string;
  description?: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  reminder?: Date;
  reminderType?: '1hour' | '1day' | 'custom';
  reminderSent?: boolean; // Track if reminder has been sent
  status: 'pending' | 'in-progress' | 'completed';
  userId: Types.ObjectId;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Task schema
const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Task title must be at least 1 character'],
      maxlength: [200, 'Task title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    reminder: {
      type: Date
    },
    reminderType: {
      type: String,
      enum: ['1hour', '1day', 'custom'],
      default: 'custom'
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending'
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true // Index for faster queries
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// Index for efficient queries (userId + status, userId + dueDate)
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ reminder: 1, reminderSent: 1 }); // Index for reminder queries

// Middleware: Set completedAt when status changes to 'completed'
taskSchema.pre('save', async function () {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== 'completed' && this.completedAt) {
      this.completedAt = undefined;
    }
  }
});

// Task model
const Task = mongoose.model<ITask>('Task', taskSchema);

export default Task;

