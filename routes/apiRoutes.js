// routes/apiRoutes.js
const router = require('express').Router();
const Stroke = require('../models/Stroke');
const Mural = require('../models/Mural');

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

// Make sure this matches the path in your frontend fetch: /api/mural/details/:wallCode
router.get('/mural/details/:wallCode', async (req, res) => {
  try {
    const { wallCode } = req.params;
    const upperCode = wallCode.toUpperCase();

    // Use "Mural" instead of "Wall"
    const mural = await Mural.findOne({ wallCode: upperCode });

    if (!mural) {
      return res.status(404).json({ error: "Mural session not found" });
    }

    // Map the mural data to the format your MuralCanvas expects
    res.json({
      wallCode: mural.wallCode,
      muralName: mural.muralName,
      durationSeconds: mural.settings?.durationSeconds || 60,
      finishAt: mural.finishAt, // This is crucial for your Late Joiner fix!
      isStarted: mural.isStarted || false
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;