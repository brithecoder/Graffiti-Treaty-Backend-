const express = require('express');
const cors = require('cors');
const http = require('http'); // Built-in Node module
const { Server } = require('socket.io');
require('dotenv').config();
const path = require('path');
const db = require('./config/connections');
const routes = require('./routes/apiRoutes');
const socketHandler = require("./socketHandler");

const app = express();
const PORT = process.env.PORT || 3001;

// 2. ENABLE CORS for Express routes
app.use(cors({
  origin: "http://localhost:5173", // Trust your Vite app
  methods: ["GET", "POST"],
  credentials: true
}));

 
// 1. Wrap Express in an HTTP Server
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Update this to match your Vite port!
    methods: ["GET", "POST"]
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 
// if we're in production, serve client/build as static assets
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname,'./client/dist')));
}
 
app.use('/api', routes);



app.get('/api/mural/strokes/:wallCode', async (req, res) => {
  try {
    const { wallCode } = req.params;
    
    // Find all strokes, sorted by timestamp (oldest first)
    const strokes = await Stroke.find({ wallCode })
      .sort({ timestamp: 1 }) // This ensures the timelapse plays in order
      .lean(); // Faster performance
      
    res.json(strokes);
  } catch (err) {
    console.error("❌ Failed to fetch strokes:", err);
    res.status(500).json({ error: "Could not fetch mural data" });
  }
});

// Initialize the Socket Logic
socketHandler(io);

 db.once('open', () => {
  console.log('✅ Connected to MongoDB');
  server.listen(PORT, () => {
    console.log(`🌍 Mural Server & Socket.io running on port ${PORT}!`);
  });
});