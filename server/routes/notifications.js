const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.uid }).sort({ createdAt: -1 }).limit(50);
    res.status(200).json(notifications);
  } catch {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.uid },
      { $set: { read: true } },
      { new: true }
    );
    res.status(200).json(notification);
  } catch {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.put('/read-all', async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.uid, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

router.delete('/clear', async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.uid });
    res.status(200).json({ message: 'All notifications cleared' });
  } catch {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

module.exports = router;
