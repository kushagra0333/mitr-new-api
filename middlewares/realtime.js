import Device from '../models/Device.js';
import TriggerSession from '../models/TriggerSession.js';
import { Server } from 'socket.io';

let io = null;

export const initializeRealtime = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    socket.on('subscribe', async (deviceId) => {
      try {
        const device = await Device.findOne({ deviceId });
        if (!device) {
          socket.emit('error', 'Device not found');
          return;
        }

        socket.join(`device:${deviceId}`);
        console.log(`Client ${socket.id} subscribed to device ${deviceId}`);

        // Send current session status if available
        if (device.currentSession) {
          const session = await TriggerSession.findById(device.currentSession);
          if (session && session.status === 'active') {
            socket.emit('sessionUpdate', {
              sessionId: session._id,
              status: 'active',
              coordinatesCount: session.coordinates.length,
              lastUpdate: session.coordinates.length > 0 ? 
                session.coordinates[session.coordinates.length - 1].timestamp : null
            });
          }
        }
      } catch (error) {
        socket.emit('error', 'Error subscribing to device updates');
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

export const emitLocationUpdate = (deviceId, location) => {
  if (io) {
    io.to(`device:${deviceId}`).emit('locationUpdate', location);
  }
};

export const emitSessionEvent = (deviceId, event) => {
  if (io) {
    io.to(`device:${deviceId}`).emit('sessionEvent', event);
  }
};