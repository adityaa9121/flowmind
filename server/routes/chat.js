const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const { 
  createChat, 
  getChats, 
  getChatById, 
  deleteChat, 
  updateChat,
  sendMessage 
} = require('../controllers/chatController');

// All chat routes are protected
router.use(verifyToken);

router.post('/', createChat);
router.get('/', getChats);
router.get('/:id', getChatById);
router.put('/:id', updateChat);
router.delete('/:id', deleteChat);
router.post('/:id/message', sendMessage);

module.exports = router;
