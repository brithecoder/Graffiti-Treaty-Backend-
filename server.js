const express = require('express');
const cors = require('cors');
const http = require('http'); // Built-in Node module
const { Server } = require('socket.io');
require('dotenv').config();
const path = require('path');
const db = require('./config/connections');
const routes = require('./routes/apiRoutes');
const { updateRoomCount } = require('./utils/helpers');

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
  app.use(express.static(path.join(__dirname, '../client/build')));
}
 
app.use('/api', routes);

// 3. Socket.io Logic
io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  // Join a specific wall room based on wallCode
  socket.on('join_wall', (wallCode) => {
    socket.join(wallCode);
    console.log(`👤 User ${socket.id} joined room: ${wallCode}`)
    updateRoomCount(io, wallCode);;
  });

 // Server-side updated for SECONDS
socket.on("start_mission", ({ wallCode, durationSeconds }) => {
  // durationSeconds is now e.g., 300 (for 5 mins)
  const finishAt = Date.now() + (durationSeconds * 1000); 
  
  console.log(`🚀 Mission starting in room ${wallCode}. Ends at: ${new Date(finishAt).toLocaleTimeString()}`);

  // Broadcast to EVERYONE in the room including the sender
  io.to(wallCode).emit("mission_start_confirmed", { 
    finishAt,
    durationSeconds // Passing this back helps clients initialize their state
  });
});


  // Listen for drawing data and broadcast to everyone else in that room
  socket.on('send_stroke', (data) => {
    // data should contain { wallCode, strokeData, slotIndex }
    socket.to(data.wallCode).emit('receive_stroke', data);
  });

 // Change 'disconnect' to 'disconnecting'
  socket.on('disconnecting', () => {
    console.log('🔥 User disconnecting:', socket.id);
    
    // socket.rooms contains the rooms the user is currently in
    socket.rooms.forEach((room) => {
      // Ignore the socket's private room (which is just its own ID)
      if (room !== socket.id) {
        // We wait 100ms so the count is calculated AFTER they are gone
        setTimeout(() => updateRoomCount(io, room), 100);
      }
    });
  });

  socket.on('disconnect', () => {
    console.log('💨 User fully disconnected');
  });


});//end of socketConnection


 db.once('open', () => {
  console.log('✅ Connected to MongoDB');
  server.listen(PORT, () => {
    console.log(`🌍 Mural Server & Socket.io running on port ${PORT}!`);
  });
});