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
    required: true
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