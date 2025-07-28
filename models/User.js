// user.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    minlength: 6, // Keep minlength for when password is provided
    select: false
  },
  // ... other fields remain unchanged
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (this.isModified('password') && this.password) { // Only hash if password exists
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ... rest of the file unchanged
const User = mongoose.model('User', userSchema);
export default User;