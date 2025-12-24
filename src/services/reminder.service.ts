import cron from 'node-cron';
import Task from '../models/task.model';
import User from '../models/user.model';
import { sendTaskReminderEmail } from '../lib/email';

/**
 * Calculate reminder date based on reminder type and due date
 * @param dueDate - Task due date
 * @param reminderType - Type of reminder ('1hour', '1day', or 'custom')
 * @param customReminderDate - Custom reminder date (only used if reminderType is 'custom')
 * @returns Calculated reminder date
 */
export const calculateReminderDate = (
  dueDate: Date,
  reminderType: '1hour' | '1day' | 'custom',
  customReminderDate?: Date
): Date => {
  const due = new Date(dueDate);

  switch (reminderType) {
    case '1hour':
      // 1 hour before due date
      return new Date(due.getTime() - 60 * 60 * 1000);
    
    case '1day':
      // 1 day before due date
      return new Date(due.getTime() - 24 * 60 * 60 * 1000);
    
    case 'custom':
      // Use custom reminder date if provided
      if (customReminderDate) {
        return new Date(customReminderDate);
      }
      // Default to 1 hour before if no custom date provided
      return new Date(due.getTime() - 60 * 60 * 1000);
    
    default:
      // Default to 1 hour before
      return new Date(due.getTime() - 60 * 60 * 1000);
  }
};

/**
 * Send reminders for tasks that are due
 * This function is called by the cron job
 */
export const sendTaskReminders = async (): Promise<void> => {
  try {
    const now = new Date();
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000); // 5 minute window

    // Find tasks that:
    // 1. Have a reminder set
    // 2. Reminder time is between now and 5 minutes from now
    // 3. Reminder hasn't been sent yet
    // 4. Task is not completed
    // 5. Due date hasn't passed
    const tasksToRemind = await Task.find({
      reminder: {
        $gte: now,
        $lte: fiveMinutesFromNow
      },
      reminderSent: false,
      status: { $ne: 'completed' },
      dueDate: { $gte: now }
    });

    console.log(`📧 Found ${tasksToRemind.length} tasks to send reminders for`);

    for (const task of tasksToRemind) {
      try {
        const user = await User.findById(task.userId);
        
        if (!user || !user.email || !user.isEmailVerified) {
          console.log(`⚠️  Skipping task ${task._id}: User not found or email not verified`);
          continue;
        }

        // Send reminder email
        await sendTaskReminderEmail(
          user.email,
          user.name,
          task.title,
          task.description,
          task.dueDate,
          task.priority
        );

        // Mark reminder as sent
        task.reminderSent = true;
        await task.save();

        console.log(`✅ Reminder sent for task: ${task.title} (User: ${user.email})`);
      } catch (error: any) {
        console.error(`❌ Error sending reminder for task ${task._id}:`, error.message);
        // Continue with next task even if one fails
      }
    }
  } catch (error: any) {
    console.error('❌ Error in sendTaskReminders:', error);
  }
};

/**
 * Start the reminder cron job
 * Runs every 5 minutes to check for reminders
 */
export const startReminderCronJob = (): void => {
  // Run every 5 minutes: '*/5 * * * *'
  // You can change this to run more frequently (e.g., every minute: '* * * * *')
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running reminder check...');
    await sendTaskReminders();
  });

  console.log('✅ Reminder cron job started (runs every 5 minutes)');
};

/**
 * Manual trigger for testing (optional)
 */
export const triggerReminderCheck = async (): Promise<void> => {
  console.log('🔔 Manually triggering reminder check...');
  await sendTaskReminders();
};

