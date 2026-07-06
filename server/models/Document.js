const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  summary: {
    type: String,
    default: ''
  },
  keyPoints: [{
    type: String
  }],
  actionItems: [{
    type: String
  }],
  tags: [{
    type: String
  }]
}, { timestamps: true });

DocumentSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Document', DocumentSchema);
