import mongoose from 'mongoose';

const coordinateSchema = new mongoose.Schema({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  accuracy: {
    type: Number,
    required: false
  },
  speed: {
    type: Number,
    required: false
  }
});

const triggerSessionSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed'],
    default: 'active'
  },
  triggerStartLocation: {
    type: coordinateSchema
  },
  coordinates: [coordinateSchema],
  manualStop: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Add index for faster queries
triggerSessionSchema.index({ deviceId: 1, status: 1 });
triggerSessionSchema.index({ userId: 1 });
triggerSessionSchema.index({ startTime: -1 });

const TriggerSession = mongoose.model('TriggerSession', triggerSessionSchema);

export default TriggerSession;