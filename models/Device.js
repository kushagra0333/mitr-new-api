import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  }],
  triggerWords: [{
    type: String
  }],
  isTriggered: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date
  }
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;