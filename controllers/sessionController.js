import Device from '../models/Device.js';
import TriggerSession from '../models/TriggerSession.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import smsService from '../services/triggersmsservice.js';

const activeSessions = new Map();

export const startTrigger = async (req, res, next) => {
  try {
    const { deviceId, initialLocation } = req.body;

    if (!deviceId) throw new ApiError(400, "Device ID is required");

    const device = await Device.findOne({ deviceId });
    if (!device) throw new ApiError(404, "Device not found");

    if (device.currentSession) {
      const oldSession = await TriggerSession.findById(device.currentSession);
      if (oldSession?.status === "active") {
        throw new ApiError(400, "Device already has an active session");
      }
    }

    const session = new TriggerSession({
      deviceId,
      userId: device.ownerId,
      status: "active",
      startTime: new Date(),
      triggerStartLocation: initialLocation || null
    });

    await session.save();

    device.currentSession = session._id;
    device.lastActive = new Date();
    await device.save();

    activeSessions.set(deviceId, {
      sessionId: session._id,
      lastUpdate: new Date(),
      coordinatesCount: 0
    });

    // 🟢 SEND EMERGENCY SMS (no await)
    if (device.emergencyContacts?.length > 0) {
      smsService
        .sendEmergencySMS(device.emergencyContacts, deviceId)
        .then(r => console.log("Emergency SMS completed:", r))
        .catch(e => console.error("SMS failed:", e.message));
    }

    new ApiResponse(res, 201, {
      message: "Trigger session started",
      sessionId: session._id,
      startTime: session.startTime,
      updateInterval: device.locationUpdateInterval,
      triggerStartLocation: session.triggerStartLocation,
      smsSent: device.emergencyContacts?.length > 0
    });
  } catch (error) {
    next(error);
  }
};

export const addCoordinates = async (req, res, next) => {
  try {
    const { deviceId, latitude, longitude, accuracy, speed } = req.body;

    if (!deviceId || latitude === undefined || longitude === undefined) {
      throw new ApiError(400, 'Device ID and coordinates are required');
    }

    // Check if device has an active session
    const device = await Device.findOne({ deviceId });
    if (!device || !device.currentSession) {
      throw new ApiError(404, 'No active session found for device');
    }

    const session = await TriggerSession.findOne({
      _id: device.currentSession,
      status: 'active'
    });

    if (!session) {
      throw new ApiError(404, 'No active session found for device');
    }

    // Add new coordinates
    const newCoordinate = {
      latitude,
      longitude,
      accuracy,
      speed,
      timestamp: new Date()
    };

    session.coordinates.push(newCoordinate);
    await session.save();

    // Update device last active time
    device.lastActive = new Date();
    await device.save();

    // Update in-memory tracking
    if (activeSessions.has(deviceId)) {
      const sessionData = activeSessions.get(deviceId);
      sessionData.lastUpdate = new Date();
      sessionData.coordinatesCount = session.coordinates.length;
      activeSessions.set(deviceId, sessionData);
    }

    new ApiResponse(res, 200, {
      message: 'Coordinates added to session',
      sessionId: session._id,
      coordinatesCount: session.coordinates.length,
      latestLocation: newCoordinate
    });
  } catch (error) {
    next(error);
  }
};

export const stopTrigger = async (req, res, next) => {
  try {
    const { deviceId, manualStop = true } = req.body;

    if (!deviceId) {
      throw new ApiError(400, 'Device ID is required');
    }

    // Check if device has an active session
    const device = await Device.findOne({ deviceId });
    if (!device || !device.currentSession) {
      throw new ApiError(404, 'No active session found for device');
    }

    const session = await TriggerSession.findOneAndUpdate(
      {
        _id: device.currentSession,
        status: 'active'
      },
      {
        status: 'completed',
        endTime: new Date(),
        manualStop
      },
      { new: true }
    );

    if (!session) {
      throw new ApiError(404, 'No active session found for device');
    }

    // Clear current session from device
    device.currentSession = null;
    device.lastActive = new Date();
    await device.save();

    // Remove from in-memory tracking
    activeSessions.delete(deviceId);

    new ApiResponse(res, 200, {
      message: 'Trigger session stopped',
      sessionId: session._id,
      startTime: session.startTime,
      endTime: session.endTime,
      coordinatesCount: session.coordinates.length,
      duration: (session.endTime - session.startTime) / 1000 // in seconds
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionHistory = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { deviceId, limit = 10, page = 1 } = req.query;

    const query = { userId };
    if (deviceId) query.deviceId = deviceId;

    const options = {
      sort: { startTime: -1 },
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    };

    const sessions = await TriggerSession.find(query, null, options)
      .select('deviceId startTime endTime status coordinates triggerStartLocation manualStop');

    const total = await TriggerSession.countDocuments(query);

    new ApiResponse(res, 200, {
      sessions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
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
        status: session.status,
        coordinates: session.coordinates,
        triggerStartLocation: session.triggerStartLocation,
        manualStop: session.manualStop,
        duration: session.endTime ? (session.endTime - session.startTime) / 1000 : null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    
    const activeSessions = await TriggerSession.find({
      userId,
      status: 'active'
    }).select('deviceId startTime coordinates triggerStartLocation');

    new ApiResponse(res, 200, {
      activeSessions
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionStatus = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const userId = req.user._id;

    const device = await Device.findOne({ deviceId, ownerId: userId });
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    if (!device.currentSession) {
      return new ApiResponse(res, 200, {
        isActive: false,
        message: 'No active session'
      });
    }

    const session = await TriggerSession.findOne({
      _id: device.currentSession,
      status: 'active'
    });

    if (!session) {
      return new ApiResponse(res, 200, {
        isActive: false,
        message: 'No active session'
      });
    }

    new ApiResponse(res, 200, {
      isActive: true,
      sessionId: session._id,
      startTime: session.startTime,
      coordinatesCount: session.coordinates.length,
      lastUpdate: session.coordinates.length > 0 ? 
        session.coordinates[session.coordinates.length - 1].timestamp : null,
      updateInterval: device.locationUpdateInterval
    });
  } catch (error) {
    next(error);
  }
};