import Device from '../models/Device.js';
import TriggerSession from '../models/TriggerSession.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';

export const startTrigger = async (req, res, next) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      throw new ApiError(400, 'Device ID is required');
    }

    const device = await Device.findOne({ deviceId });
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    if (device.isTriggered) {
      throw new ApiError(400, 'Device is already triggered');
    }

    const session = new TriggerSession({
      deviceId,
      userId: device.ownerId,
      active: true
    });
    await session.save();

    device.isTriggered = true;
    device.lastActive = new Date();
    await device.save();

    new ApiResponse(res, 201, {
      message: 'Trigger session started',
      sessionId: session._id,
      startTime: session.startTime
    });
  } catch (error) {
    next(error);
  }
};

export const addCoordinates = async (req, res, next) => {
  try {
    const { deviceId, lat, long } = req.body;

    if (!deviceId || lat === undefined || long === undefined) {
      throw new ApiError(400, 'Device ID and coordinates are required');
    }

    const session = await TriggerSession.findOne({
      deviceId,
      active: true
    });

    if (!session) {
      throw new ApiError(404, 'No active session found for device');
    }

    session.coordinates.push({ lat, long });
    await session.save();

    await Device.findOneAndUpdate(
      { deviceId },
      { lastActive: new Date() }
    );

    new ApiResponse(res, 200, {
      message: 'Coordinates added to session',
      sessionId: session._id,
      coordinatesCount: session.coordinates.length
    });
  } catch (error) {
    next(error);
  }
};

export const stopTrigger = async (req, res, next) => {
  try {
    const { deviceId } = req.body;

    if (!deviceId) {
      throw new ApiError(400, 'Device ID is required');
    }

    const session = await TriggerSession.findOneAndUpdate(
      {
        deviceId,
        active: true
      },
      {
        active: false,
        endTime: new Date()
      },
      { new: true }
    );

    if (!session) {
      throw new ApiError(404, 'No active session found for device');
    }

    await Device.findOneAndUpdate(
      { deviceId },
      { isTriggered: false }
    );

    new ApiResponse(res, 200, {
      message: 'Trigger session stopped',
      sessionId: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      coordinatesCount: session.coordinates.length
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const sessions = await TriggerSession.find({ userId })
      .sort({ startTime: -1 })
      .select('-coordinates');

    new ApiResponse(res, 200, {
      sessions
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id;

    if (!sessionId) {
      throw new ApiError(400, 'Session ID is required');
    }

    const session = await TriggerSession.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      throw new ApiError(404, 'Session not found');
    }

    new ApiResponse(res, 200, {
      session
    });
  } catch (error) {
    next(error);
  }
};