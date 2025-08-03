// authController.js
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { generateOTP, getOTPExpiry, sendVerificationOTP } from '../services/otpService.js';
import { generateAuthToken } from '../services/tokenService.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../services/emailService.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import Joi from 'joi';

export const signupInitiate = async (req, res) => {
  try {
    const schema = Joi.object({
      userID: Joi.string().min(3).max(20).required(),
      email: Joi.string().email().required(),
      name: Joi.string().min(2).max(50).required(),
    });

    const { userID, email, name } = req.body;

    // Validate request
    const { error } = schema.validate({ userID, email, name });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ userID }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this userID or email',
      });
    }

    // Send OTP
    const otp = await sendVerificationOTP(email);

    // Store OTP in the database
    const newOTP = new OTP({
      email,
      otp,
    });

    await newOTP.save();

    res.status(200).json({
      success: true,
      message: 'OTP sent to email successfully. Proceed to complete signup.',
      otp: process.env.NODE_ENV === 'development' ? otp : undefined,
      tempUser: { userID, email, name }, // Include name in response
    });
  } catch (error) {
    console.error('Signup Initiate Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during signup initiation',
    });
  }
};
export const signupComplete = async (req, res, next) => {
  try {
    // Add debug logs
    console.log('Starting signup complete', req.body);

    const schema = Joi.object({
      userID: Joi.string().min(3).max(20).required(),
      email: Joi.string().email().required(),
      otp: Joi.string().length(6).required(),
      name: Joi.string().min(2).max(50).required(),
      password: Joi.string().min(6).required(),
      confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    });

    const { error } = schema.validate(req.body);
    if (error) {
      console.log('Validation error:', error);
      throw new ApiError(400, error.details[0].message);
    }

    const { userID, email, otp, name, password } = req.body;

    // Check if user already exists (double verification)
    const existingUser = await User.findOne({
      $or: [{ userID }, { email }],
    });

    if (existingUser) {
      throw new ApiError(400, 'User already exists with this userID or email');
    }

    // Find OTP record
    const otpRecord = await OTP.findOne({ email });
    console.log('Database OTP record:', otpRecord);
    
    if (!otpRecord) {
      console.log('No OTP record found for email:', email);
      throw new ApiError(400, 'OTP not found or expired');
    }

    // Verify OTP (case insensitive)
    const isOtpValid = otpRecord.otp.localeCompare(otp, undefined, { sensitivity: 'base' }) === 0;
    const isOtpExpired = otpRecord.createdAt < new Date(Date.now() - 10 * 60 * 1000);

    console.log(`OTP validation: 
      Input OTP: ${otp}
      Stored OTP: ${otpRecord.otp}
      Match: ${isOtpValid}
      Expired: ${isOtpExpired}`);

    if (!isOtpValid || isOtpExpired) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    // Create new user
    const user = new User({
      userID,
      email,
      name,
      password,
      verified: true
    });

    // Save user to database
    await user.save();

    // Generate JWT token
    const token = generateAuthToken(user._id);

    // Add token to user's tokens array
    user.tokens = user.tokens.concat({ token });
    await user.save();

    // Delete used OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Prepare user data for response (without sensitive info)
    const userData = {
      id: user._id,
      userID: user.userID,
      email: user.email,
      name: user.name,
      verified: user.verified
    };

    // Send success response
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: userData
      }
    });

  } catch (error) {
    console.error('Signup complete error:', error);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const schema = Joi.object({
      userID: Joi.string().required(),
      password: Joi.string().required(),
    });

    const { userID, password } = req.body;

    // Validate input
    const { error } = schema.validate({ userID, password });
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    // Find user and validate password
    const user = await User.findOne({ userID }).select('+password');
    if (!user) {
      throw new ApiError(401, 'Invalid credentials');
    }

    if (!user.verified) {
      throw new ApiError(403, 'Account not verified');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid credentials');
    }

    // Generate new token
    const token = generateAuthToken(user._id);

    user.tokens = user.tokens.concat({ token });
    await user.save();

    // Respond with user info and token
    new ApiResponse(res, 200, {
      user: {
        id: user._id,
        userID: user.userID,
        email: user.email,
        name: user.name,
        verified: user.verified,
        deviceIds: user.deviceIds,
      },
      token,
    });
  } catch (error) {
    next(error);
  }
};


export const forgotPassword = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
    });

    const { email } = req.body;

    // Validate request
    const { error } = schema.validate({ email });
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const otp = generateOTP();
    const otpExpires = getOTPExpiry();

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    const emailSent = await sendPasswordResetEmail(email, otp);
    if (!emailSent) {
      throw new ApiError(500, 'Failed to send OTP');
    }

    new ApiResponse(res, 200, {
      message: 'Password reset OTP sent to email',
      email,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const schema = Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().length(6).required(),
      newPassword: Joi.string().min(6).required(),
      confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
    });

    const { email, otp, newPassword, confirmPassword } = req.body;

    // Validate request
    const { error } = schema.validate({ email, otp, newPassword, confirmPassword });
    if (error) {
      throw new ApiError(400, error.details[0].message);
    }

    const user = await User.findOne({ email }).select('+otp +otpExpires');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    new ApiResponse(res, 200, {
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
    await req.user.save();

    new ApiResponse(res, 200, {
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logoutAll = async (req, res, next) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    new ApiResponse(res, 200, {
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
};
export const updateUserInfo = async (req, res) => {
  const { name, userID } = req.body;
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if new userID is taken
    if (userID && userID !== user.userID) {
      const existingUser = await User.findOne({ userID });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User ID already taken',
        });
      }
      user.userID = userID;
    }

    if (name) {
      user.name = name;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User information updated',
      data: {
        user: { userID: user.userID, email: user.email, name: user.name },
      },
    });
  } catch (error) {
    console.error('Update User Info Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during user info update',
    });
  }
};