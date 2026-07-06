const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const geminiService = require('../services/geminiService');

const createChat = async (req, res) => {
  try {
    const { title } = req.body;
    const chat = new Chat({
      userId: req.user.uid,
      title: title || 'New Chat'
    });
    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error('[ChatController Error] createChat:', error.stack || error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

const getChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.uid }).sort({ updatedAt: -1 });
    res.status(200).json(chats);
  } catch (error) {
    console.error('[ChatController Error] getChats:', error.stack || error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

const getChatById = async (req, res) => {
  try {
    const chatId = req.params.id;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    const chat = await Chat.findOne({ _id: chatId, userId: req.user.uid });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    
    const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    res.status(200).json({ chat, messages });
  } catch (error) {
    console.error('[ChatController Error] getChatById:', error.stack || error);
    res.status(500).json({ error: 'Failed to fetch chat details' });
  }
};

const deleteChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    const chat = await Chat.findOneAndDelete({ _id: chatId, userId: req.user.uid });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    
    await Message.deleteMany({ chatId: chat._id });
    res.status(200).json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('[ChatController Error] deleteChat:', error.stack || error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

const updateChat = async (req, res) => {
  try {
    const chatId = req.params.id;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ error: 'Invalid chat ID format' });
    }

    const { title, isPinned } = req.body;
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const chat = await Chat.findOneAndUpdate(
      { _id: chatId, userId: req.user.uid },
      { $set: updateData },
      { new: true }
    );

    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.status(200).json(chat);
  } catch (error) {
    console.error('[ChatController Error] updateChat:', error.stack || error);
    res.status(500).json({ error: 'Failed to update chat' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    let chatId = req.params.id;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    let chat = null;

    if (chatId && chatId !== 'undefined' && chatId !== 'null') {
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: 'Invalid chat ID format' });
      }
      chat = await Chat.findOne({ _id: chatId, userId: req.user.uid });
    }

    if (!chat) {
      chat = new Chat({
        userId: req.user.uid,
        title: message.substring(0, 30) + (message.length > 30 ? '...' : '')
      });
      await chat.save();
      chatId = chat._id.toString();
    }

    const userMsg = new Message({
      chatId: chat._id,
      senderRole: 'user',
      content: message
    });
    await userMsg.save();

    const history = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 });
    const previousHistory = history.slice(0, -1);

    let aiText = '';
    try {
      aiText = await geminiService.generateAIResponse(message, null, { history: previousHistory });
    } catch (aiError) {
      console.error(`[ChatController AI Error] sendMessage:`, aiError.stack || aiError);
      const status = aiError.status || 500;
      return res.status(status).json({ error: aiError.message || 'AI generation failed.' });
    }

    const aiMsg = new Message({
      chatId: chat._id,
      senderRole: 'model',
      content: aiText
    });
    await aiMsg.save();
    
    if (history.length <= 1 && (chat.title === 'New Chat' || chat.title === 'New Conversation')) {
      try {
        const titlePrompt = `Generate a very short, concise title (3-5 words maximum) for a chat that starts with this message: "${message}". Do not use quotes, punctuation, or generic words like "Chat about". Just the topic.`;
        const generatedTitle = await geminiService.generateAIResponse(titlePrompt, null, { retries: 1 });
        chat.title = generatedTitle.trim() || message.substring(0, 30);
      } catch (titleError) {
        console.error(`[ChatController] Failed to generate chat title:`, titleError.message);
        chat.title = message.substring(0, 30) + (message.length > 30 ? '...' : '');
      }
    }
    chat.updatedAt = Date.now();
    await chat.save();

    res.status(200).json({ userMessage: userMsg, aiMessage: aiMsg, chat });
  } catch (error) {
    console.error(`[ChatController Error] sendMessage:`, error.stack || error);
    res.status(500).json({ error: 'An internal server error occurred while processing your request.' });
  }
};

module.exports = {
  createChat,
  getChats,
  getChatById,
  deleteChat,
  updateChat,
  sendMessage
};
