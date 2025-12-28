const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

    const user = await User.create({
      name,
      email,
      mobile,
      password: hashedPassword,
      verified: false,
      verificationToken: token,
      verificationTokenExpires: expires
    });

    // verification link
    const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || 'http://localhost:5000';
    const verifyLink = `${baseUrl}/auth/verify/${token}`;

    await sendVerificationEmail(email, verifyLink);

    return res.status(200).json({
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET /auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verificationToken: token });

    if (!user) return res.status(400).send('Invalid or expired verification link');

    if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
      return res.status(400).send('Verification link expired. Please register again.');
    }

    user.verified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return res.send(`
      <html><body style="font-family:system-ui">
        <h2>Email verified ✅</h2>
        <p>You can now open the app and log in.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('Verify error', err);
    return res.status(500).send('Server error');
  }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) return res.status(400).json({ message: 'Invalid credentials' });

    if (!user.verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      message: 'Login successful',
      token
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
