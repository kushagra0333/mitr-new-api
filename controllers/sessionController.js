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
      active: true,
      triggerStartLocation: req.body.initialLocation || null
    });
    await session.save();

    device.isTriggered = true;
    device.lastActive = new Date();
    await device.save();

    new ApiResponse(res, 201, {
      message: 'Trigger session started',
      sessionId: session._id,
      startTime: session.startTime,
      triggerStartLocation: session.triggerStartLocation
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
      coordinatesCount: session.coordinates.length,
      latestLocation: { lat, long }
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
    const { deviceId } = req.query;

    const query = { userId };
    if (deviceId) query.deviceId = deviceId;

    const sessions = await TriggerSession.find(query)
      .sort({ startTime: -1 })
      .select('deviceId startTime endTime active coordinatesCount triggerStartLocation');

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
      session: {
        id: session._id,
        deviceId: session.deviceId,
        startTime: session.startTime,
        endTime: session.endTime,
        active: session.active,
        coordinates: session.coordinates,
        triggerStartLocation: session.triggerStartLocation
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentLocation = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ deviceId, ownerId: userId });
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    if (!device.isTriggered) {
      throw new ApiError(403, 'Device is not currently triggered');
    }

    const session = await TriggerSession.findOne({ deviceId, active: true });
    if (!session || !session.coordinates.length) {
      throw new ApiError(404, 'No active location data available');
    }

    new ApiResponse(res, 200, {
      currentLocation: session.coordinates[session.coordinates.length - 1]
    });
  } catch (error) {
    next(error);
  }
};