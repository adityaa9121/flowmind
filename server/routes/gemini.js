const express = require('express');
const router = express.Router();

const geminiService = require('../services/geminiService');

router.post('/message', async (req, res) => {
  try {
    const { messages, systemInstruction } = req.body;
    
    if (!messages || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const text = await geminiService.generateAIResponse(messages, systemInstruction);
    res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini Route Error:', error);
    const status = error.status || 500;
    res.status(status).json({ error: error.message || 'Failed to communicate with Gemini.' });
  }
});

module.exports = router;
