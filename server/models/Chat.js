const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true
  },
  title: {
    type: String,
    default: 'New Chat'
  },
  isPinned: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

chatSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Chat', chatSchema);
