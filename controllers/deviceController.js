import Device from '../models/Device.js';
import DeviceData from '../models/DeviceData.js';
import AppError from '../utils/appError.js';
import { deviceStateManager } from '../utils/deviceState.js';

export const linkDevice = async (req, res, next) => {
  try {
    const { deviceId, name, emergencyContacts } = req.body;

    // Check if device already exists
    const existingDevice = await Device.findOne({ deviceId });
    if (existingDevice) {
      return next(new AppError('Device is already linked to another user', 400));
    }

    const newDevice = await Device.create({
      deviceId,
      user: req.user._id,
      name: name || `My MITR Device`,
      emergencyContacts: emergencyContacts || []
    });

    // Add device to user's devices array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { devices: newDevice._id }
    });

    res.status(201).json({
      status: 'success',
      data: {
        device: newDevice
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getMyDevices = async (req, res, next) => {
  try {
    const devices = await Device.find({ user: req.user._id })
      .populate('user', 'name email')
      .select('-__v');

    res.status(200).json({
      status: 'success',
      results: devices.length,
      data: {
        devices
      }
    });
  } catch (err) {
    next(err);
  }
};

export const getDeviceInfo = async (req, res, next) => {
  try {
    const device = await Device.findOne({
      _id: req.params.deviceId,
      user: req.user._id
    }).populate('user', 'name email');

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        device
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateDevice = async (req, res, next) => {
  try {
    const device = await Device.findOneAndUpdate(
      {
        _id: req.params.deviceId,
        user: req.user._id
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        device
      }
    });
  } catch (err) {
    next(err);
  }
};

export const deleteDevice = async (req, res, next) => {
  try {
    const device = await Device.findOneAndDelete({
      _id: req.params.deviceId,
      user: req.user._id
    });

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    // Remove device from user's devices array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { devices: device._id }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    next(err);
  }
};

export const triggerDevice = async (req, res, next) => {
  try {
    const device = await Device.findOne({
      _id: req.params.deviceId,
      user: req.user._id
    });

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    // Trigger device - this would be connected to actual hardware
    deviceStateManager.triggerDevice(device.deviceId);

    res.status(200).json({
      status: 'success',
      message: 'Device triggered successfully',
      data: {
        deviceId: device.deviceId,
        triggered: true
      }
    });
  } catch (err) {
    next(err);
  }
};

export const stopTrigger = async (req, res, next) => {
  try {
    const device = await Device.findOne({
      _id: req.params.deviceId,
      user: req.user._id
    });

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    // Stop device trigger
    deviceStateManager.stopTrigger(device.deviceId);

    res.status(200).json({
      status: 'success',
      message: 'Device trigger stopped',
      data: {
        deviceId: device.deviceId,
        triggered: false
      }
    });
  } catch (err) {
    next(err);
  }
};

export const checkDeviceStatus = async (req, res, next) => {
  try {
    const device = await Device.findOne({
      _id: req.params.deviceId,
      user: req.user._id
    });

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    const status = deviceStateManager.checkDeviceStatus(device.deviceId);

    res.status(200).json({
      status: 'success',
      data: {
        deviceId: device.deviceId,
        ...status
      }
    });
  } catch (err) {
    next(err);
  }
};

export const addEmergencyContact = async (req, res, next) => {
  try {
    const { name, phone, email, relationship } = req.body;

    const device = await Device.findOneAndUpdate(
      {
        _id: req.params.deviceId,
        user: req.user._id
      },
      {
        $push: {
          emergencyContacts: {
            name,
            phone,
            email,
            relationship
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        device
      }
    });
  } catch (err) {
    next(err);
  }
};

export const removeEmergencyContact = async (req, res, next) => {
  try {
    const device = await Device.findOneAndUpdate(
      {
        _id: req.params.deviceId,
        user: req.user._id
      },
      {
        $pull: {
          emergencyContacts: { _id: req.params.contactId }
        }
      },
      {
        new: true
      }
    );

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        device
      }
    });
  } catch (err) {
    next(err);
  }
};

export const updateEmergencyContact = async (req, res, next) => {
  try {
    const device = await Device.findOne({
      _id: req.params.deviceId,
      user: req.user._id
    });

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    const contact = device.emergencyContacts.id(req.params.contactId);
    if (!contact) {
      return next(new AppError('No contact found with that ID', 404));
    }

    Object.assign(contact, req.body);
    await device.save();

    res.status(200).json({
      status: 'success',
      data: {
        device
      }
    });
  } catch (err) {
    next(err);
  }
};

export const postDeviceData = async (req, res, next) => {
  try {
    const { latitude, longitude, batteryLevel, isSOS, address } = req.body;

    const device = await Device.findOne({ deviceId: req.params.deviceId });
    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    // Update device last location
    device.lastLocation = {
      type: 'Point',
      coordinates: [longitude, latitude],
      address,
      timestamp: Date.now()
    };
    if (batteryLevel) device.batteryLevel = batteryLevel;
    await device.save();

    // Create data record
    const data = await DeviceData.create({
      device: device._id,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
        address
      },
      batteryLevel,
      isSOS: isSOS || false
    });

    // If this is an SOS signal, trigger emergency protocols
    if (isSOS) {
      deviceStateManager.triggerDevice(device.deviceId);
      // Here you would add logic to notify emergency contacts
    }

    res.status(201).json({
      status: 'success',
      data
    });
  } catch (err) {
    next(err);
  }
};

export const getDeviceData = async (req, res, next) => {
  try {
    const device = await Device.findOne({
      _id: req.params.deviceId,
      user: req.user._id
    });

    if (!device) {
      return next(new AppError('No device found with that ID', 404));
    }

    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 100;
    const skip = (page - 1) * limit;

    const data = await DeviceData.find({ device: device._id })
      .sort('-timestamp')
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      status: 'success',
      results: data.length,
      data
    });
  } catch (err) {
    next(err);
  }
};