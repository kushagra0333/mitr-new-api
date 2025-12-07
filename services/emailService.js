// services/emailService.js
import { Resend } from "resend";
import config from "../config/env.js";

const resend = new Resend(config.RESEND_API_KEY);

// Helper function to build FROM value
function getFrom() {
  return `${config.RESEND_FROM_NAME} <${config.RESEND_FROM_ADDRESS}>`;
}

// SEND VERIFICATION / SIGNUP OTP
export const sendOTPEmail = async (email, otp) => {
  try {
    const from = getFrom();
    console.log("Sending OTP from:", from);

    const result = await resend.emails.send({
      from,
      to: email,
      subject: "Your MITR SOS Verification Code",
      html: `
        <h2>Your Verification Code</h2>
        <p>Your OTP is:</p>
        <h1>${otp}</h1>
        <p>Expires in ${config.OTP_EXPIRY_MINUTES} minutes.</p>
      `,
    });

    if (result.error) {
      console.error("❌ Resend OTP Error:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Resend Exception OTP:", error);
    return false;
  }
};

// SEND PASSWORD RESET OTP
export const sendPasswordResetEmail = async (email, otp) => {
  try {
    const from = getFrom();
    console.log("Sending Reset OTP from:", from);

    const result = await resend.emails.send({
      from,
      to: email,
      subject: "MITR SOS Password Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Your reset OTP is:</p>
        <h1>${otp}</h1>
        <p>This code expires in ${config.OTP_EXPIRY_MINUTES} minutes.</p>
      `,
    });

    if (result.error) {
      console.error("❌ Resend Reset Error:", result.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Resend Exception Reset:", error);
    return false;
  }
};
