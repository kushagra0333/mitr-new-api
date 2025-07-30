import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  API_KEY: process.env.API_KEY,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL,
  OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES || 10,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEVICE_DEFAULT_PASSWORD: process.env.DEVICE_DEFAULT_PASSWORD || 'default123'
};