const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const { verifyToken } = require('../middleware/authMiddleware');

// Create Support Ticket
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, email, subject, description, priority } = req.body;
    
    if (!name || !email || !subject || !description) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const ticket = new SupportTicket({
      userId: req.user.uid,
      name,
      email,
      subject,
      description,
      priority: priority || 'Medium'
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch {
    res.status(500).json({ error: 'Failed to create support ticket' });
  }
});

module.exports = router;
