const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/auth');

// GET /messages/:chatId
router.get('/:chatId', authMiddleware, async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', '_id name mobile verified')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /messages/:chatId
router.post('/:chatId', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const chat = await Chat.findById(req.params.chatId);
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    if (!chat.members.map(String).includes(req.user.id)) {
      return res.status(403).json({ error: 'Not a member of this chat' });
    }

    const msg = new Message({
      chat: req.params.chatId,
      sender: req.user.id,
      text: text.trim()
    });

    await msg.save();
    await msg.populate('sender', '_id name mobile verified');

    // Update chat last message and timestamp
    chat.lastMessage = msg.text;
    chat.updatedAt = new Date();
    await chat.save();

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
