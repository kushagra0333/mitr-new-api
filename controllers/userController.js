import User from '../models/User.js';
import Device from '../models/Device.js';
import TriggerSession from '../models/TriggerSession.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = req.user;

    new ApiResponse(res, 200, {
      user: {
        id: user._id,
        userID: user.userID,
        email: user.email,
        verified: user.verified,
        deviceId: user.deviceId,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current and new password are required');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    new ApiResponse(res, 200, {
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      User.findByIdAndDelete(userId),
      Device.findOneAndDelete({ ownerId: userId }),
      TriggerSession.deleteMany({ userId })
    ]);

    new ApiResponse(res, 200, {
      message: 'Account and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const linkDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user._id;

    if (!deviceId) {
      throw new ApiError(400, 'Device ID is required');
    }

    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      throw new ApiError(400, 'Device already linked to another user');
    }

    const user = await User.findById(userId);
    if (user.deviceId) {
      throw new ApiError(400, 'User already has a device linked');
    }

    const [_, updatedUser] = await Promise.all([
      Device.create({
        deviceId,
        ownerId: userId,
        emergencyContacts: [],
        triggerWords: []
      }),
      User.findByIdAndUpdate(
        userId,
        { deviceId },
        { new: true }
      )
    ]);

    new ApiResponse(res, 200, {
      message: 'Device linked successfully',
      deviceId,
      user: {
        id: updatedUser._id,
        userID: updatedUser.userID,
        email: updatedUser.email,
        deviceId: updatedUser.deviceId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const device = await Device.findOne({ ownerId: req.user._id });
    if (!device) {
      throw new ApiError(404, 'No device linked to this account');
    }

    new ApiResponse(res, 200, {
      device: {
        id: device._id,
        deviceId: device.deviceId,
        emergencyContacts: device.emergencyContacts,
        triggerWords: device.triggerWords,
        isTriggered: device.isTriggered,
        lastActive: device.lastActive
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmergencyContacts = async (req, res, next) => {
  try {
    const { emergencyContacts } = req.body;

    if (!emergencyContacts || !Array.isArray(emergencyContacts)) {
      throw new ApiError(400, 'Valid emergency contacts array is required');
    }

    emergencyContacts.forEach(contact => {
      if (!contact.name || !contact.phone) {
        throw new ApiError(400, 'Each contact must have name and phone');
      }
    });

    const device = await Device.findOneAndUpdate(
      { ownerId: req.user._id },
      { emergencyContacts },
      { new: true }
    );

    if (!device) {
      throw new ApiError(404, 'No device linked to this account');
    }

    new ApiResponse(res, 200, {
      message: 'Emergency contacts updated successfully',
      emergencyContacts: device.emergencyContacts
    });
  } catch (error) {
    next(error);
  }
};

export const updateTriggerWords = async (req, res, next) => {
  try {
    const { triggerWords } = req.body;

    if (!triggerWords || !Array.isArray(triggerWords)) {
      throw new ApiError(400, 'Valid trigger words array is required');
    }

    const device = await Device.findOneAndUpdate(
      { ownerId: req.user._id },
      { triggerWords },
      { new: true }
    );

    if (!device) {
      throw new ApiError(404, 'No device linked to this account');
    }

    new ApiResponse(res, 200, {
      message: 'Trigger words updated successfully',
      triggerWords: device.triggerWords
    });
  } catch (error) {
    next(error);
  }
};