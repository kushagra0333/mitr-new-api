// services/emailService.js

import nodemailer from "nodemailer";
import config from "../config/env.js";

// Gmail SMTP transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.SMTP_USER,   // your gmail
    pass: config.SMTP_PASS    // app password
  }
});

// Send OTP
export const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `MITR SOS <${config.SMTP_USER}>`,
      to: email,
      subject: "Your MITR SOS Verification Code",
      html: `
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in ${config.OTP_EXPIRY_MINUTES} minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("❌ Nodemailer OTP Error:", error);
    return false;
  }
};


// Send Reset OTP
export const sendPasswordResetEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: `MITR SOS <${config.SMTP_USER}>`,
      to: email,
      subject: "MITR SOS Password Reset",
      html: `
        <p>Your password reset code is: <strong>${otp}</strong></p>
        <p>This code will expire in ${config.OTP_EXPIRY_MINUTES} minutes.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("❌ Nodemailer Reset Error:", error);
    return false;
  }
};
