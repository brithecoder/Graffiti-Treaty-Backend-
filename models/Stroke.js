const mongoose = require('mongoose');

const StrokeSchema = new mongoose.Schema({
  wallCode: { type: String, required: true, index: true },
  artistName: String,
  color: String,
  brushSize: Number,
  points: [{ x: Number, y: Number }], // Array of coordinates
  // This is the key for the timelapse:
  timestamp: { type: Number, default: Date.now } 
});
module.exports = { 
  StrokeModel: mongoose.model('Stroke', StrokeSchema),
  StrokeSchema: StrokeSchema 
};