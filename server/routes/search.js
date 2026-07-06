const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Document = require('../models/Document');
const Workflow = require('../models/Workflow');
const Task = require('../models/Task');
const Email = require('../models/Email');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(200).json([]);

    const userId = req.user.uid;
    const regex = new RegExp(q, 'i');

    const [chats, docs, workflows, tasks, emails] = await Promise.all([
      Chat.find({ userId, title: { $regex: regex } }).limit(5),
      Document.find({ userId, title: { $regex: regex } }).limit(5),
      Workflow.find({ userId, name: { $regex: regex } }).limit(5),
      Task.find({ userId, title: { $regex: regex } }).limit(5),
      Email.find({ userId, topic: { $regex: regex } }).limit(5),
    ]);

    const results = [
      ...chats.map(c => ({ id: c._id, title: c.title, type: 'Chat', link: '/dashboard/chat' })),
      ...docs.map(d => ({ id: d._id, title: d.title, type: 'Document', link: '/dashboard/documents' })),
      ...workflows.map(w => ({ id: w._id, title: w.name, type: 'Workflow', link: '/dashboard/automation' })),
      ...tasks.map(t => ({ id: t._id, title: t.title, type: 'Task', link: '/dashboard/automation' })),
      ...emails.map(e => ({ id: e._id, title: e.topic, type: 'Email', link: '/dashboard/automation' }))
    ];

    res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

module.exports = router;
