const mongoose = require('mongoose');
const { StrokeSchema } = require('./Stroke');


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
    lastActive: { type: Date, default: Date.now }
  }],

  startTime: Date,
  endTime: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Mural', MuralSchema);