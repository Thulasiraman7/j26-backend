const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    if (!name || !mobile || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ $or: [{ email }, { mobile }] });
    if (existing) {
      return res.status(400).json({ error: 'Email or mobile already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      mobile,
      email,
      password: hashed,
      verified: true   // auto‑verify for now
    });

    await user.save();

    // 🔑 Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Return token + user object
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        verified: user.verified
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


// LOGIN (email OR mobile + password)
router.post('/login', async (req, res) => {
  try {
    const { email, mobile, password } = req.body;
    if ((!email && !mobile) || !password) {
      return res.status(400).json({ error: 'Email or mobile and password are required' });
    }

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email }] : []),
        ...(mobile ? [{ mobile }] : [])
      ]
    });

    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    if (!user.verified) {
      return res.status(403).json({ error: 'Account not verified' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        verified: user.verified
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CONTACTS SYNC (WhatsApp-style)
router.post('/checkNumbers', authMiddleware, async (req, res) => {
  try {
    const { numbers } = req.body;
    if (!numbers || !Array.isArray(numbers)) {
      return res.status(400).json({ error: 'Numbers array required' });
    }

    const users = await User.find(
      { mobile: { $in: numbers } },
      '_id name mobile email verified'
    );

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SEARCH BY NUMBER
router.get('/findByNumber/:number', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne(
      { mobile: req.params.number },
      '_id name mobile email verified'
    );
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// TEMP VERIFY ENDPOINT (optional, not needed if auto-verify is on)
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    user.verified = true;
    await user.save();
    res.json({ message: 'Account verified', verified: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
