import { z } from 'zod';

// Register schema
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(50, 'Name cannot exceed 50 characters')
      .trim(),
    email: z
      .string()
      .email('Please provide a valid email')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
  })
});

// Login schema
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Please provide a valid email')
      .toLowerCase()
      .trim(),
    password: z
      .string()
      .min(1, 'Password is required')
  })
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Please provide a valid email')
      .toLowerCase()
      .trim()
  })
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
  })
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(6, 'New password must be at least 6 characters')
  })
});

// Verify email schema
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Verification token is required')
  })
});

// Resend verification email schema
export const resendVerificationSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Please provide a valid email')
      .toLowerCase()
      .trim()
  })
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
});

// Enable 2FA schema
export const enableTwoFactorSchema = z.object({
  body: z.object({})
});

// Verify 2FA setup schema
export const verifyTwoFactorSetupSchema = z.object({
  body: z.object({
    token: z.string().length(6, '2FA token must be 6 digits').regex(/^\d+$/, '2FA token must contain only numbers')
  })
});

// Verify 2FA login schema
export const verifyTwoFactorLoginSchema = z.object({
  body: z.object({
    token: z.string().length(6, '2FA token must be 6 digits').regex(/^\d+$/, '2FA token must contain only numbers'),
    backupCode: z.string().optional() // Optional backup code
  })
});

// Disable 2FA schema
export const disableTwoFactorSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Password is required'),
    token: z.string().length(6, '2FA token must be 6 digits').regex(/^\d+$/, '2FA token must contain only numbers').optional()
  })
});
