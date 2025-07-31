import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  devicePassword: {
    type: String,
    required: true,
    select: false
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  emergencyContacts: [{
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  triggerWords: [{
    type: String
  }],
  currentSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TriggerSession'
  },
  lastActive: {
    type: Date
  },
  locationUpdateInterval: {
    type: Number,
    default: 30, // seconds between location updates
    min: 5,
    max: 300
  }
});

deviceSchema.pre('save', async function(next) {
  if (this.isModified('devicePassword')) {
    this.devicePassword = await bcrypt.hash(this.devicePassword, 10);
  }
  next();
});

deviceSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.devicePassword);
};

const Device = mongoose.model('Device', deviceSchema);
export default Device;