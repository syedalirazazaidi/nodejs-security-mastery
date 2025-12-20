import bcrypt from 'bcryptjs';

/**
 * Hash a password using bcrypt
 * @param password - Plain text password
 * @param saltRounds - Number of salt rounds (default: 10)
 * @returns Hashed password
 */
export const hashPassword = async (password: string, saltRounds: number = 10): Promise<string> => {
  return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

