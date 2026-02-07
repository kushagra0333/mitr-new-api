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

    if (!sent) {
      if (config.NODE_ENV === 'development') {
        console.warn(`⚠️ Development Override: Email failed to send to ${email} (likely Resend restriction). Returning OTP anyway for testing.`);
        console.warn(`🔑 OTP is: ${otp}`);
        return otp;
      }
      throw new Error("Failed to send OTP email");
    }

    return otp;
  } catch (error) {
    if (config.NODE_ENV === 'development' && error.message === "Failed to send OTP email") {
       throw error; // Already handled above
    }
    console.error("❌ Error in sendVerificationOTP:", error);
    throw new Error("Failed to send verification OTP");
  }
};

// SEND RESET OTP
export const sendResetOTP = async (email) => {
  try {
    const otp = generateOTP();
    const sent = await sendPasswordResetEmail(email, otp);

    if (!sent) {
      if (config.NODE_ENV === 'development') {
        console.warn(`⚠️ Development Override: Reset Email failed to send to ${email}. Returning OTP anyway.`);
        console.warn(`🔑 OTP is: ${otp}`);
        return otp;
      }
      throw new Error("Failed to send reset OTP email");
    }

    return otp;
  } catch (error) {
     if (config.NODE_ENV === 'development' && error.message === "Failed to send reset OTP email") {
       throw error;
    }
    console.error("❌ Error in sendResetOTP:", error);
    throw new Error("Failed to send reset OTP");
  }
};
