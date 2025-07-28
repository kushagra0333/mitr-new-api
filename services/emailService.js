import sgMail from '@sendgrid/mail';
import config from '../config/env.js';

sgMail.setApiKey(config.SENDGRID_API_KEY);

export const sendOTPEmail = async (email, otp) => {
  try {
    const msg = {
      to: email,
      from: config.SENDGRID_FROM_EMAIL || 'no-reply@mitrsos.com', // Use verified sender email
      subject: 'Your MITR SOS Verification Code',
      text: `Your verification code is: ${otp}\n\nThis code will expire in ${config.OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your verification code is: <strong>${otp}</strong></p><p>This code will expire in ${config.OTP_EXPIRY_MINUTES} minutes.</p>`
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email, otp) => {
  try {
    const msg = {
      to: email,
      from: config.SENDGRID_FROM_EMAIL || 'no-reply@mitrsos.com', // Use verified sender email
      subject: 'MITR SOS Password Reset',
      text: `Your password reset code is: ${otp}\n\nThis code will expire in ${config.OTP_EXPIRY_MINUTES} minutes.`,
      html: `<p>Your password reset code is: <strong>${otp}</strong></p><p>This code will expire in ${config.OTP_EXPIRY_MINUTES} minutes.</p>`
    };

    await sgMail.send(msg);
    return true;
  } catch (error) {
    console.error('Error sending reset email:', error);
    return false;
  }
};