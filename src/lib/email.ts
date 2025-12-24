import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration
const createTransporter = () => {
  const USE_REAL_EMAIL = process.env.USE_REAL_EMAIL === 'true';
  const NODE_ENV = process.env.NODE_ENV || 'development';
  
  // Use real SMTP if USE_REAL_EMAIL is true, otherwise use Mailtrap for testing
  if (USE_REAL_EMAIL || NODE_ENV === 'production') {
    // Real SMTP configuration (Gmail, SendGrid, etc.)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('EMAIL_USER and EMAIL_PASSWORD must be set in .env file for real email sending');
    }
    
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Mailtrap configuration (for testing - emails go to Mailtrap inbox, not real emails)
    if (!process.env.MAILTRAP_USER || !process.env.MAILTRAP_PASS) {
      throw new Error('MAILTRAP_USER and MAILTRAP_PASS must be set in .env file');
    }
    
    return nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.MAILTRAP_PORT || '2525'),
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS
      }
    });
  }
};

/**
 * Send email verification
 * @param email - Recipient email
 * @param verificationToken - Verification token
 * @param name - User's name
 */
export const sendVerificationEmail = async (
  email: string,
  verificationToken: string,
  name: string
): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const verificationUrl = `${process.env.PORT || 'http://localhost:5000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${name}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #4CAF50; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="color: #666; word-break: break-all;">${verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 24 hours.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent successfully:', info.messageId);
  } catch (error: any) {
    console.error('❌ Error sending verification email:', error);
    throw error; // Re-throw to let the caller handle it
  }
};

/**
 * Send password reset email
 * @param email - Recipient email
 * @param resetToken - Password reset token
 * @param name - User's name
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  name: string
): Promise<void> => {
  const transporter = createTransporter();
  
  const resetUrl = `${process.env.PORT || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'akuraza6@gmail.com',
    to: email,
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Hello ${name}!</h2>
        <p>You requested to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #f44336; color: white; padding: 12px 30px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="color: #666; word-break: break-all;">${resetUrl}</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">
          This link will expire in 1 hour. If you didn't request this, please ignore this email.
        </p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send task reminder email
 * @param email - Recipient email
 * @param name - User's name
 * @param taskTitle - Task title
 * @param taskDescription - Task description
 * @param dueDate - Task due date
 * @param priority - Task priority
 */
export const sendTaskReminderEmail = async (
  email: string,
  name: string,
  taskTitle: string,
  taskDescription: string | undefined,
  dueDate: Date,
  priority: string
): Promise<void> => {
  try {
    const transporter = createTransporter();

    const formattedDueDate = new Date(dueDate).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const priorityColors: Record<string, string> = {
      high: '#f44336',
      medium: '#ff9800',
      low: '#4CAF50'
    };

    const priorityColor = priorityColors[priority] || '#2196F3';

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: `🔔 Reminder: ${taskTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: ${priorityColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
            <h2 style="margin: 0; color: white;">🔔 Task Reminder</h2>
          </div>
          <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px;">
            <p style="color: #333; font-size: 16px;">Hello <strong>${name}</strong>!</p>
            <p style="color: #666;">This is a reminder about your upcoming task:</p>
            
            <div style="background-color: white; padding: 15px; border-left: 4px solid ${priorityColor}; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin-top: 0; color: #333;">${taskTitle}</h3>
              ${taskDescription ? `<p style="color: #666; margin: 10px 0;">${taskDescription}</p>` : ''}
              <div style="margin-top: 15px;">
                <p style="margin: 5px 0; color: #666;">
                  <strong style="color: #333;">Due Date:</strong> ${formattedDueDate}
                </p>
                <p style="margin: 5px 0; color: #666;">
                  <strong style="color: #333;">Priority:</strong> 
                  <span style="color: ${priorityColor}; font-weight: bold; text-transform: capitalize;">${priority}</span>
                </p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/tasks" 
                 style="background-color: ${priorityColor}; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                View Task
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              This is an automated reminder. You can manage your task reminders in your task tracker app.
            </p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Task reminder email sent successfully to ${email}:`, info.messageId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error: any) {
    console.error(`❌ Error sending task reminder email to ${email}:`, error.message);
    throw error;
  }
};
