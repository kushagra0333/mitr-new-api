import User from '../models/User.js';
import Device from '../models/Device.js';
import TriggerSession from '../models/TriggerSession.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = req.user;

    const devices = await Device.find({ ownerId: user._id });

    new ApiResponse(res, 200, {
      user: {
        id: user._id,
        userID: user.userID,
        name: user.name,
        email: user.email,
        verified: user.verified,
        deviceIds: user.deviceIds,
        createdAt: user.createdAt,
        devices: devices.map(device => ({
          deviceId: device.deviceId,
          isTriggered: device.isTriggered,
          lastActive: device.lastActive
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();

    new ApiResponse(res, 200, {
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        userID: user.userID,
        name: user.name,
        email: user.email,
        deviceIds: user.deviceIds
      }
    });
  } catch (error) {
    next(error);
  }
};export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new ApiError(400, 'All password fields are required');
    }

    if (newPassword !== confirmPassword) {
      throw new ApiError(400, 'New passwords do not match');
    }

    // Retrieve user with password field
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      throw new ApiError(401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    new ApiResponse(res, 200, {
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change Password Error:', error);
    next(error);
  }
};

export const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await Promise.all([
      User.findByIdAndDelete(userId),
      Device.deleteMany({ ownerId: userId }),
      TriggerSession.deleteMany({ userId })
    ]);

    new ApiResponse(res, 200, {
      message: 'Account and all associated data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const removeDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user._id;

    const device = await Device.findOne({ deviceId, ownerId: userId });
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    await Device.findOneAndUpdate({ deviceId }, { $unset: { ownerId: '' } });
    await User.findByIdAndUpdate(userId, { $pull: { deviceIds: deviceId } });

    new ApiResponse(res, 200, {
      message: 'Device removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const linkDevice = async (req, res, next) => {
  try {
    const { deviceId, devicePassword } = req.body;
    const userId = req.user._id;

    if (!deviceId || !devicePassword) {
      throw new ApiError(400, 'Device ID and password are required');
    }

    const device = await Device.findOne({ deviceId }).select('+devicePassword');
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    const isMatch = await device.comparePassword(devicePassword);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid device password');
    }

    if (device.ownerId && device.ownerId.toString() !== userId.toString()) {
      throw new ApiError(400, 'Device already linked to another user');
    }

    if (!device.ownerId) {
      await Device.findByIdAndUpdate(device._id, { ownerId: userId });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $addToSet: { deviceIds: deviceId } },
      { new: true }
    );

    new ApiResponse(res, 200, {
      message: 'Device linked successfully',
      deviceId,
      user: {
        id: user._id,
        userID: user.userID,
        name: user.name,
        email: user.email,
        deviceIds: user.deviceIds
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ deviceId, ownerId: userId });
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    new ApiResponse(res, 200, {
      device: {
        id: device._id,
        deviceId: device.deviceId,
        emergencyContacts: device.emergencyContacts,
        triggerWords: device.triggerWords,
        isTriggered: device.isTriggered,
        lastActive: device.lastActive,
        currentLocation: device.isTriggered ? (await getCurrentLocation(deviceId)) : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmergencyContacts = async (req, res, next) => {
  try {
    const { deviceId, emergencyContacts } = req.body;

    if (!deviceId || !emergencyContacts || !Array.isArray(emergencyContacts)) {
      throw new ApiError(400, 'Device ID and valid emergency contacts array are required');
    }

    if (emergencyContacts.length > 3) {
      throw new ApiError(400, 'Maximum 3 emergency contacts allowed');
    }

    emergencyContacts.forEach(contact => {
      if (!contact.name || !contact.phone || !/^\d{10,15}$/.test(contact.phone)) {
        throw new ApiError(400, 'Each contact must have a name and a valid phone number (10-15 digits)');
      }
    });

    const device = await Device.findOneAndUpdate(
      { deviceId, ownerId: req.user._id },
      { emergencyContacts },
      { new: true }
    );

    if (!device) {
      throw new ApiError(404, 'Device not found');
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
    const { deviceId, triggerWords } = req.body;

    if (!deviceId || !triggerWords || !Array.isArray(triggerWords)) {
      throw new ApiError(400, 'Device ID and valid trigger words array are required');
    }

    triggerWords.forEach(word => {
      if (!word || typeof word !== 'string' || word.trim() === '') {
        throw new ApiError(400, 'Trigger words must be non-empty strings');
      }
    });

    const device = await Device.findOneAndUpdate(
      { deviceId, ownerId: req.user._id },
      { triggerWords },
      { new: true }
    );

    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    new ApiResponse(res, 200, {
      message: 'Trigger words updated successfully',
      triggerWords: device.triggerWords
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentLocation = async (deviceId) => {
  const session = await TriggerSession.findOne({ deviceId, active: true });
  if (!session || !session.coordinates.length) return null;
  return session.coordinates[session.coordinates.length - 1];
};
