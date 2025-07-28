import User from '../models/User.js';
import Device from '../models/Device.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

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

    const userHasDevice = await User.findOne({ _id: userId, deviceId: { $exists: true } });
    if (userHasDevice) {
      throw new ApiError(400, 'User already has a device linked');
    }

    const device = new Device({
      deviceId,
      ownerId: userId,
      emergencyContacts: [],
      triggerWords: []
    });
    await device.save();

    const user = await User.findByIdAndUpdate(
      userId,
      { deviceId },
      { new: true }
    );

    new ApiResponse(res, 200, {
      message: 'Device linked successfully',
      deviceId,
      user: {
        id: user._id,
        userID: user.userID,
        email: user.email,
        deviceId: user.deviceId
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const device = await Device.findOne({ ownerId: userId });
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
      { ownerId: userId },
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
    const { triggerWords } = req.body;
    const userId = req.user._id;

    if (!triggerWords || !Array.isArray(triggerWords)) {
      throw new ApiError(400, 'Trigger words array is required');
    }

    const device = await Device.findOneAndUpdate(
      { ownerId: userId },
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