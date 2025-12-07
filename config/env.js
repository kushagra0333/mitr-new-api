import dotenv from 'dotenv';

dotenv.config();

export default {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  API_KEY: process.env.API_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_NAME: process.env.RESEND_FROM_NAME || "MITR SOS",
  RESEND_FROM_ADDRESS: process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev",
  RESEND_FROM_EMAIL: `${process.env.RESEND_FROM_NAME || "MITR SOS"} <${process.env.RESEND_FROM_ADDRESS || "onboarding@resend.dev"}>`,

  OTP_EXPIRY_MINUTES: process.env.OTP_EXPIRY_MINUTES || 10,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DEVICE_DEFAULT_PASSWORD: process.env.DEVICE_DEFAULT_PASSWORD || 'default123',

  // Twilio Configuration
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER
};