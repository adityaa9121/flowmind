const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true
  },
  name: {
    type: String,
    required: true
  },
  trigger: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

WorkflowSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Workflow', WorkflowSchema);
