const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  tone: {
    type: String,
    required: true
  },
  recipient: {
    type: String,
    default: ''
  },
  keyPoints: {
    type: String,
    default: ''
  },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true });

emailSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Email', emailSchema);
