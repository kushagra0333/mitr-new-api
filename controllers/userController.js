import User from '../models/User.js';
import AppError from '../utils/appError.js';

// Get user profile with devices info
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    // Populate devices info with emergency contacts
    await user.populate('devices');

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Update user profile info (excluding password)
export const updateUserProfile = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Remove fields that should not be updated here
    delete updates.password;
    delete updates.passwordConfirm;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    next(err);
  }
};
