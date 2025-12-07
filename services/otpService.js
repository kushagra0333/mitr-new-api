// services/otpService.js
import crypto from "crypto";
import config from "../config/env.js";
import { sendOTPEmail, sendPasswordResetEmail } from "./emailService.js";

// Generate OTP
export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Expiry time
export const getOTPExpiry = () => {
  const minutes = parseInt(config.OTP_EXPIRY_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

// SEND VERIFICATION OTP
export const sendVerificationOTP = async (email) => {
  try {
    const otp = generateOTP();
    const sent = await sendOTPEmail(email, otp);

    if (!sent) throw new Error("Failed to send OTP email");

    return otp;
  } catch (error) {
    console.error("❌ Error in sendVerificationOTP:", error);
    throw new Error("Failed to send verification OTP");
  }
};

// SEND RESET OTP
export const sendResetOTP = async (email) => {
  try {
    const otp = generateOTP();
    const sent = await sendPasswordResetEmail(email, otp);

    if (!sent) throw new Error("Failed to send reset OTP email");

    return otp;
  } catch (error) {
    console.error("❌ Error in sendResetOTP:", error);
    throw new Error("Failed to send reset OTP");
  }
};
