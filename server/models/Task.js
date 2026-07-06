const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  userId: {
    type: String, // Firebase UID
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  sourceDocumentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document'
  }
}, { timestamps: true });

TaskSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model('Task', TaskSchema);
