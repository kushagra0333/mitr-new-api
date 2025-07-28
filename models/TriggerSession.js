import mongoose from 'mongoose';

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
  active: {
    type: Boolean,
    default: true
  },
  coordinates: [{
    lat: {
      type: Number,
      required: true
    },
    long: {
      type: Number,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
});

const TriggerSession = mongoose.model('TriggerSession', triggerSessionSchema);

export default TriggerSession;