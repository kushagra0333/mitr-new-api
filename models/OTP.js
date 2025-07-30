// models/OTP.js
import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Automatically delete after 10 minutes (600 seconds)
  },
});

const OTP = mongoose.model('OTP', otpSchema);
export default OTP;