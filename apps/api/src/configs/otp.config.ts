import { registerAs } from '@nestjs/config';

export const otpConfig = registerAs('otp', () => ({
  secret: process.env.OTP_HMAC_SECRET,
  devMode: process.env.OTP_DEV_MODE === 'true',
  expiresInSeconds: 300,
  resetExpiresInSeconds: 600,
  resendSeconds: 60,
  maxAttempts: 5,
  maxSendsPerHour: 5,
  attemptWindowSeconds: 900,
  keyPrefix: 'mediconnect:otp',
}));
