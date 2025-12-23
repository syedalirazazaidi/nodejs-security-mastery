import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';

/**
 * Generate a secret key for 2FA
 * @param email - User's email (for QR code label)
 * @param issuer - App name (for QR code label)
 * @returns Object with secret and QR code data URL
 */
export const generateTwoFactorSecret = async (
  email: string,
  issuer: string = 'NodeJS Mystery'
): Promise<{ secret: string; qrCodeUrl: string }> => {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${email})`,
    length: 32
  });

  if (!secret.base32) {
    throw new Error('Failed to generate 2FA secret');
  }

  // Generate QR code URL
  const otpauthUrl = secret.otpauth_url;
  if (!otpauthUrl) {
    throw new Error('Failed to generate OTP auth URL');
  }

  // Generate QR code as data URL
  const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

  return {
    secret: secret.base32,
    qrCodeUrl
  };
};

/**
 * Verify 2FA token
 * @param token - 6-digit code from authenticator app
 * @param secret - User's 2FA secret (base32)
 * @returns True if token is valid, false otherwise
 */
export const verifyTwoFactorToken = (token: string, secret: string): boolean => {
  try {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2 // Allow 2 time steps (60 seconds) of tolerance
    });

    return verified === true;
  } catch (error) {
    console.error('2FA verification error:', error);
    return false;
  }
};

/**
 * Generate backup codes for 2FA
 * @param count - Number of backup codes to generate (default: 10)
 * @returns Array of backup codes
 */
export const generateBackupCodes = (count: number = 10): string[] => {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate 8-character alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(code);
  }
  
  return codes;
};

/**
 * Verify backup code
 * @param code - Backup code to verify
 * @param backupCodes - Array of valid backup codes
 * @returns True if code is valid, false otherwise
 */
export const verifyBackupCode = (code: string, backupCodes: string[]): boolean => {
  const normalizedCode = code.toUpperCase().trim();
  return backupCodes.includes(normalizedCode);
};

