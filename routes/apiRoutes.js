// routes/apiRoutes.js
const router = require('express').Router();
const Stroke = require('../models/Stroke');

const { 
  createSession, 
  joinSession, 
  reclaimAdmin, 
  rejoinSession 
} = require('../controllers/muralControllers');

// The endpoints
router.post('/mural/create', createSession);
router.post('/mural/join', joinSession);
router.post('/mural/reclaim', reclaimAdmin);
router.post('/mural/rejoin', rejoinSession);


router.get('/mural/strokes/:wallCode', async (req, res) => {
  console.log("📡 API HIT: Fetching strokes for wall:", req.params.wallCode); // ADD THIS
  try {
    const { wallCode } = req.params;
    
    // Find all strokes, sorted by timestamp (oldest first)
    const strokes = await Stroke.find({ wallCode })
      .sort({ timestamp: 1 }) // This ensures the timelapse plays in order
      .lean(); // Faster performance
      console.log(`Successfully found ${strokes.length} strokes.`);
    res.json(strokes);
  } catch (err) {
    console.error("❌ Failed to fetch strokes:", err.message);
    res.status(500).json({ error: "Could not fetch mural data" , details: err.message});
  }
});

module.exports = router;