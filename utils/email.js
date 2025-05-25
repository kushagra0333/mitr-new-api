import nodemailer from 'nodemailer';
import AppError from './appError.js';

// Create transporter (configure for your email service)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.error('Email server connection error:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});

export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: `MITR SOS <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email sending error:', err);
    throw new AppError('There was an error sending the email. Try again later!', 500);
  }
};

export const sendPasswordReset = async (user, resetUrl) => {
  const subject = 'Your password reset token (valid for 10 minutes)';
  const message = `Forgot your password? Submit a PATCH request with your new password to: ${resetUrl}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject,
      message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">MITR SOS Password Reset</h2>
          <p>You requested a password reset. Click the button below to proceed:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
          <p style="font-size: 12px; color: #666;">This link expires in 10 minutes.</p>
        </div>
      `
    });
  } catch (err) {
    throw err;
  }
};

export const sendOtpEmail = async (user, otp) => {
  const subject = 'Your MITR SOS Login OTP';
  const message = `Your One-Time Password (OTP) for MITR SOS login is: ${otp}. It is valid for 10 minutes. If you didn't request this, please ignore this email.`;

  try {
    await sendEmail({
      email: user.email,
      subject,
      message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #007BFF;">MITR SOS Login OTP</h2>
          <p>Your One-Time Password (OTP) is:</p>
          <h1 style="color: #007BFF;">${otp}</h1>
          <p>This OTP is valid for 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `
    });
  } catch (err) {
    throw err;
  }
};
