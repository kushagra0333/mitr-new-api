// otpService.js
import crypto from 'crypto';
import config from '../config/env.js';
import { sendOTPEmail } from './emailService.js';

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const getOTPExpiry = () => {
  const expiryMinutes = parseInt(config.OTP_EXPIRY_MINUTES) || 10; // Default to 10 minutes if not set
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

export const sendVerificationOTP = async (email) => {
  try {
    const otp = generateOTP();
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      throw new Error('Failed to send OTP email');
    }
    return otp;
  } catch (error) {
    console.error('Error in sendVerificationOTP:', error);
    throw new Error('Failed to send verification OTP');
  }
};