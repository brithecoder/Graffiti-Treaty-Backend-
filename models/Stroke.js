const mongoose = require('mongoose');

const StrokeSchema = new mongoose.Schema({
  wallCode: { type: String, required: true, index: true },
  artistName:{ type: String, required: true },
  color: String,
  SlotIndex:Number,
  brushSize: Number,
  capType: String,
  points: [{ x: Number, y: Number }], // Array of coordinates
  // This is the key for the timelapse:
  timestamp: { type: Number, default: Date.now } 
});
module.exports = mongoose.model('Stroke', StrokeSchema);