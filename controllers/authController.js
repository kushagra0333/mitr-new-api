import User from '../models/User.js';
import { generateOTP, getOTPExpiry } from '../services/otpService.js';
import { generateAuthToken } from '../services/tokenService.js';
import { sendOTPEmail, sendPasswordResetEmail } from '../services/emailService.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

// authController.js
export const signupInitiate = async (req, res, next) => {
  try {
    const { userID, email } = req.body;

    const existingUser = await User.findOne({ $or: [{ userID }, { email }] });
    if (existingUser) {
      if (existingUser.userID === userID) {
        throw new ApiError(400, 'UserID already taken');
      }
      throw new ApiError(400, 'Email already registered');
    }

    const otp = generateOTP();
    const otpExpires = getOTPExpiry();

    // Send OTP email first
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      throw new ApiError(500, 'Failed to send OTP');
    }

    // Only save user if email was sent successfully
    const user = new User({
      userID,
      email,
      otp,
      otpExpires
    });
    await user.save();

    new ApiResponse(res, 200, {
      message: 'OTP sent to email',
      email
    });
  } catch (error) {
    next(error);
  }
};
export const signupComplete = async (req, res, next) => {
  try {
    const { userID, email, otp, password } = req.body;

    const user = await User.findOne({ userID, email });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.password = password;
    user.verified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = generateAuthToken(user._id);
    user.tokens = user.tokens.concat({ token });
    await user.save();

    new ApiResponse(res, 201, {
      user: {
        id: user._id,
        userID: user.userID,
        email: user.email,
        verified: user.verified,
        deviceId: user.deviceId
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { userID, password } = req.body;

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

    const token = generateAuthToken(user._id);
    user.tokens = user.tokens.concat({ token });
    await user.save();

    new ApiResponse(res, 200, {
      user: {
        id: user._id,
        userID: user.userID,
        email: user.email,
        verified: user.verified,
        deviceId: user.deviceId
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

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
      email
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

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
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
    await req.user.save();

    new ApiResponse(res, 200, {
      message: 'Logged out successfully'
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
      message: 'Logged out from all devices'
    });
  } catch (error) {
    next(error);
  }
};