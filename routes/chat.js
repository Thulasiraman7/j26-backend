const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const authMiddleware = require('../middleware/auth');

// CREATE OR FETCH CHAT
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    const myId = req.user.id;

    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [myId, otherUserId], $size: 2 }
    });

    if (!chat) {
      chat = new Chat({ isGroup: false, members: [myId, otherUserId] });
      await chat.save();
    }

    res.json({ chatId: chat._id });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

