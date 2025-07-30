import User from '../models/User.js';
import Device from '../models/Device.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

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
    const userId = req.user._id;

    if (!emergencyContacts || !Array.isArray(emergencyContacts)) {
      throw new ApiError(400, 'Emergency contacts array is required');
    }

    for (const contact of emergencyContacts) {
      if (!contact.name || !contact.phone) {
        throw new ApiError(400, 'Each contact must have name and phone');
      }
    }

    const device = await Device.findOneAndUpdate(
      { deviceId, ownerId: userId },
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
    const userId = req.user._id;

    if (!triggerWords || !Array.isArray(triggerWords)) {
      throw new ApiError(400, 'Trigger words array is required');
    }

    const device = await Device.findOneAndUpdate(
      { deviceId, ownerId: userId },
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