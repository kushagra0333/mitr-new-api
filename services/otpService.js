import crypto from 'crypto';
import config from '../config/env.js';

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const getOTPExpiry = () => {
  const expiryMinutes = parseInt(config.OTP_EXPIRY_MINUTES);
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};