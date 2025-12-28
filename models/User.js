const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  // Email verification fields
  verified: { type: Boolean, default: false },            // true only after email is verified
  verificationToken: { type: String, default: null },     // random token sent in email
  verificationTokenExpires: { type: Date, default: null } // optional expiry time (e.g., 24h)
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
