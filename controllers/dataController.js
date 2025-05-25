import DeviceData from '../models/Device.js';
import Device from '../models/Device.js';
import AppError from '../utils/appError.js';

// Device posts GPS data - protected by API key middleware
export const postDeviceData = async (req, res, next) => {
  try {
    const { deviceId, latitude, longitude, timestamp } = req.body;

    if (!deviceId || !latitude || !longitude) {
      return next(new AppError('Missing required fields', 400));
    }

    // Validate device exists
    const device = await Device.findOne({ deviceId });
    if (!device) {
      return next(new AppError('Device not found', 404));
    }

    const data = await DeviceData.create({
      deviceId,
      latitude,
      longitude,
      timestamp: timestamp || Date.now(),
    });

    res.status(201).json({
      status: 'success',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// User fetches device data by deviceId - protected by JWT
export const getDeviceData = async (req, res, next) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId, user: req.user._id });
    if (!device) {
      return next(new AppError('Device not found or not owned by you', 404));
    }

    const data = await DeviceData.find({ deviceId }).sort({ timestamp: -1 });

    res.status(200).json({
      status: 'success',
      results: data.length,
      data,
    });
  } catch (err) {
    next(err);
  }
};
