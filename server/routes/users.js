const express = require('express');
const router = express.Router();
const { syncUser } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Task = require('../models/Task');
const Document = require('../models/Document');
const Email = require('../models/Email');
const Workflow = require('../models/Workflow');
const Chat = require('../models/Chat');

// Protected route to sync user data from Firebase to MongoDB
router.post('/sync', verifyToken, syncUser);

// Update user preferences
router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const { theme, preferences } = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUid: req.user.uid },
      { $set: { theme, preferences } },
      { new: true }
    );
    res.status(200).json(user);
  } catch {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Get user stats for dashboard
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.uid;
    const tasksAutomated = await Task.countDocuments({ userId });
    const completedNotes = await Document.countDocuments({ userId });
    const emailsGenerated = await Email.countDocuments({ userId });
    const workflowsCreated = await Workflow.countDocuments({ userId });
    const aiChats = await Chat.countDocuments({ userId });

    // Calculate real hours saved. (Tasks=0.5h, Notes=0.2h, Emails=0.1h, Workflows=1h)
    const hoursSaved = (tasksAutomated * 0.5) + (completedNotes * 0.2) + (emailsGenerated * 0.1) + (workflowsCreated * 1.0);

    res.status(200).json({
      tasksAutomated,
      completedNotes,
      emailsGenerated,
      workflowsCreated,
      aiChats,
      hoursSaved: hoursSaved.toFixed(1)
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

module.exports = router;
