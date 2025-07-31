import User from '../models/User.js';
import Device from '../models/Device.js';
import TriggerSession from '../models/TriggerSession.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

export const createDevice = async (req, res, next) => {
  try {
    const { deviceId, devicePassword } = req.body;

    if (!deviceId || !devicePassword) {
      throw new ApiError(400, 'Device ID and password are required');
    }

    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      throw new ApiError(400, 'Device ID already exists');
    }

    const device = new Device({
      deviceId,
      devicePassword,
      emergencyContacts: [],
      triggerWords: [],
      isTriggered: false
    });

    await device.save();

    new ApiResponse(res, 201, {
      success: true,
      message: 'Device created successfully',
      device: {
        deviceId: device.deviceId,
        createdAt: device.createdAt
      }
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

    const trimmedDeviceId = deviceId.trim();
    const trimmedDevicePassword = devicePassword.trim();

    const device = await Device.findOne({ deviceId: trimmedDeviceId }).select('+devicePassword');
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    const isMatch = await device.comparePassword(trimmedDevicePassword);
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
      { $addToSet: { deviceIds: trimmedDeviceId } },
      { new: true }
    );

    new ApiResponse(res, 200, {
      success: true,
      message: 'Device linked successfully',
      deviceId: trimmedDeviceId,
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

    const currentLocation = device.isTriggered ? await getCurrentLocation(deviceId) : null;

    new ApiResponse(res, 200, {
      success: true,
      device: {
        id: device._id,
        deviceId: device.deviceId,
        emergencyContacts: device.emergencyContacts,
        triggerWords: device.triggerWords,
        isTriggered: device.isTriggered,
        lastActive: device.lastActive,
        currentLocation
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
      success: true,
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
      success: true,
      message: 'Trigger words updated successfully',
      triggerWords: device.triggerWords
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentLocation = async (deviceId) => {
  const session = await TriggerSession.findOne({ deviceId, active: true }).lean();
  if (!session || !session.coordinates.length) return null;
  return session.coordinates[session.coordinates.length - 1];
};