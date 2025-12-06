// services/otpService.js

import crypto from "crypto";
import config from "../config/env.js";
import { sendOTPEmail } from "./emailService.js";

export const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

export const getOTPExpiry = () => {
  const minutes = parseInt(config.OTP_EXPIRY_MINUTES) || 10;
  return new Date(Date.now() + minutes * 60 * 1000);
};

export const sendVerificationOTP = async (email) => {
  try {
    const otp = generateOTP();

    const sent = await sendOTPEmail(email, otp);

    if (!sent) {
      throw new Error("Failed to send OTP email");
    }

    return otp; // return OTP to save into DB
  } catch (error) {
    console.error("❌ Error in sendVerificationOTP:", error);
    throw new Error("Failed to send verification OTP");
  }
};
