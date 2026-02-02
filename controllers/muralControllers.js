// controllers/muralController.js
const Mural = require('../models/Mural');
const User = require('../models/User');
const { signToken } = require('../utils/auth');
const { generateShortCode } = require('../utils/helpers');


const createSession = async (req, res) => {
  const { nickname, muralName, partySize, durationSeconds } = req.body;

  const wallCode = generateShortCode(4); // e.g., "ABCD"
  const adminCode = Math.floor(1000 + Math.random() * 9000).toString(); // e.g., "1234"

  const newMural = await Mural.create({
    wallCode,
    adminCode,
    muralName: muralName || "New Mission",
    settings: {
    muralName: muralName || "New Mission",
      partySize: partySize || 10,
      durationSeconds: req.body.duration || 60,
      sessionStatus: 'lobby'
    },
    adminId: null, // Will be linked after User is created
    canvases: []
  });

  const adminUser = await User.create({
    nickname,
    role: 'admin',
    wallCode,
    slotIndex: 0
  });

  // Link the user back to the mural
  newMural.adminId = adminUser._id;
  await newMural.save();

  const token = signToken(adminUser);
  
  // Send BOTH codes to the Admin so they can write them down/save them
  res.json({ token, wallCode, adminCode, muralName }); 
};


const joinSession = async (req, res) => {
  try {
    const { wallCode, nickname } = req.body;
    const upperCode = wallCode.toUpperCase();

    const mural = await Mural.findOne({ wallCode: upperCode });
    if (!mural) return res.status(404).json({ message: "Wall not found!" });

    // --- FIX: ALLOW RE-JOINING ---
    let user = await User.findOne({ nickname, wallCode: upperCode });
    
    if (!user) {
      // Only check party size if it's a NEW user
      if (mural.canvases.length >= mural.settings.partySize) {
        return res.status(400).json({ message: "This wall is full!" });
      }

      const slotIndex = mural.canvases.length; 
      user = await User.create({
        nickname,
        role: 'artist',
        wallCode: upperCode,
        slotIndex
      });

      mural.canvases.push({
        userId: user._id,
        artistName: nickname,
        slotIndex: slotIndex,
        strokes: []
      });

      await mural.save();
    }

    const token = signToken(user);
    
    // --- FIX: SEND ALL REQUIRED DATA ---
    res.json({ 
      token, 
      slotIndex: user.slotIndex, 
      wallCode: upperCode, 
      muralName: mural.settings?.wallName || mural.muralName || mural.name || mural.settings?.muralName || "Crew Wall",
      nickname: user.nickname,    // <--- ADDED THIS
      isStarted: mural.isStarted, // <--- ADDED THIS
      settings: mural.settings 
    });

  } catch (err) {
    res.status(500).json({ message: "Server error during join", error: err.message });
  }
};

const reclaimAdmin = async (req, res) => {
  try {
    const { wallCode, adminCode } = req.body;
    const upperCode = wallCode.toUpperCase();

    const mural = await Mural.findOne({ wallCode: upperCode, adminCode });
    if (!mural) return res.status(401).json({ message: "Invalid Wall or Admin code." });

    // Find the specific admin user for THIS wall
    let user = await User.findOne({ wallCode: upperCode, role: 'admin' });
    
    if (!user) {
      return res.status(404).json({ message: "Admin user session not found." });
    }

    const token = signToken(user);
    // Return the whole mural so the frontend knows the current state
    res.json({ token, role: 'admin', slotIndex: user.slotIndex, mural });
  } catch (err) {
    res.status(500).json({ message: "Error reclaiming admin status" });
  }
};

// controllers/muralController.js

const rejoinSession = async (req, res) => {
  try {
    const { wallCode, nickname } = req.body;
    const upperCode = wallCode.toUpperCase();

    // 1. Find the user by nickname and wallCode
    const user = await User.findOne({ 
      nickname: nickname, 
      wallCode: upperCode 
    });

    if (!user) {
      return res.status(404).json({ 
        message: "No artist found with that nickname on this wall." 
      });
    }

    // 2. Find the mural to get current settings/state
    const mural = await Mural.findOne({ wallCode: upperCode });

    // 3. Issue a fresh token
    const token = signToken(user);

    res.json({ 
      token, 
      slotIndex: user.slotIndex, 
      role: user.role,
      settings: mural.settings 
    });
  } catch (err) {
    res.status(500).json({ message: "Error rejoining session", error: err.message });
  }
};

module.exports = { createSession, joinSession, reclaimAdmin, rejoinSession };