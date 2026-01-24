const mongoose = require('mongoose');

// Define the stroke structure once to reuse it
const StrokeSchema = new mongoose.Schema({
  points: [{ x: Number, y: Number }],
  color: String,
  size: Number,
  cap: String,
  isEraser: Boolean,
  timestamp: { type: Date, default: Date.now }
});

const MuralSchema = new mongoose.Schema({
  wallCode: { type: String, required: true, unique: true },
  adminCode: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  muralName: { type: String },
  settings: {
    partySize: { type: Number, min: 1, max: 30, default: 10 },
    durationSeconds: { type: Number, min: 60, max: 3600, default: 1},
    sessionStatus: { 
      type: String, 
      enum: ['lobby', 'active', 'finished'], 
      default: 'lobby' 
    }
  },

  // Each user gets one of these
  canvases: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    artistName: String,
    slotIndex: { type: Number, min: 0, max: 29 },
    strokes: [StrokeSchema], // Individual paint data per user
    lastActive: { type: Date, default: Date.now }
  }],

  startTime: Date,
  endTime: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mural', MuralSchema);