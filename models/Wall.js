// models/Wall.js
const mongoose = require('mongoose');

const wallSchema = new mongoose.Schema({
wallCode: { type: String, unique: true, required: true },
  
  // SESSION STATE
  status: { 
    type: String, 
    enum: ['waiting', 'active', 'finished'], 
    default: 'waiting' 
  },
  
  // CONFIGURATION
  timerDuration: { type: Number, default: 60 }, // Stores 60, 180, 300, or 600 (seconds)
  bgType: { type: String, default: 'brick' },
  
  // PARTICIPANTS
  creatorName: String,
  joinedArtists: [String], // Array of names like ['bri', 'gemini', 'etc']
  
  // TIMESTAMPS
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },// Set when the creator clicks "Start
  finishAt: { type: Number }, 
  endedAt: { type: Date },   // Set when the timer hits zero
  
  // METADATA
  thumbnail: { type: String },
});
module.exports = mongoose.model('Wall', wallSchema);