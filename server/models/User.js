const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  preferences: {
    emailAlerts: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true }
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'dark'
  }
}, { timestamps: true }); // timestamps automatically handles createdAt and updatedAt

userSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('User', userSchema);
