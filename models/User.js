// models/User.js
const mongoose = require('mongoose');



const UserSchema = new mongoose.Schema({
  nickname: { type: String, required: true },
  role: { type: String, enum: ['admin', 'artist'], default: 'artist' },
  wallCode: { type: String, required: true },
  slotIndex: { type: Number }, // Which of the 30 canvases they own
  createdAt: { type: Date, default: Date.now, expires: '24h' } // Auto-delete old sessions
});

module.exports = mongoose.model('User', UserSchema);