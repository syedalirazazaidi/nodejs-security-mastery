import mongoose, { Schema, Document } from 'mongoose';

// User interface
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  googleId?: string; // Google OAuth ID
  role: 'user' | 'admin';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  isTwoFactorEnabled: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  tokenVersion: number;
  refreshToken?: string;
  refreshTokenExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// User schema
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password: {
      type: String,
      required: function (this: IUser) {
        // Password required only if not using OAuth
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default in queries
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allows multiple null values
      select: false // Don't return googleId by default in queries
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isEmailVerified: {
      type: Boolean,
      default: function (this: IUser) {
        // Auto-verify email for OAuth users
        return !!this.googleId;
      }
    },
    emailVerificationToken: {
      type: String,
      select: false // Don't return token by default in queries
    },
    emailVerificationExpires: {
      type: Date,
      select: false // Don't return expiration by default in queries
    },
    isTwoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String,
      select: false // Don't return secret by default in queries
    },
    twoFactorBackupCodes: {
      type: [String],
      select: false // Don't return backup codes by default in queries
    },
    tokenVersion: {
      type: Number,
      default: 0
    },
    refreshToken: {
      type: String,
      select: false // Don't return refresh token by default in queries
    },
    refreshTokenExpires: {
      type: Date,
      select: false // Don't return expiration by default in queries
    },
    resetPasswordToken: {
      type: String,
      select: false // Don't return token by default in queries
    },
    resetPasswordExpires: {
      type: Date,
      select: false // Don't return expiration by default in queries
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// User model
const User = mongoose.model<IUser>('User', userSchema);

export default User;

