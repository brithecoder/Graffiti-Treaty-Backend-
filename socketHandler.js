
const { updateRoomCount } = require('./utils/helpers');
const { StrokeModel: Stroke } = require('./models/Stroke');
const Wall = require("./models/Wall");
//  Socket.io Logic

module.exports = (io) => {
io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  // Join a specific wall room based on wallCode
  socket.on('join_wall', (wallCode) => {
    socket.join(wallCode);
    console.log(`👤 User ${socket.id} joined room: ${wallCode}`)
    updateRoomCount(io, wallCode);;
  });

 // Server-side updated for SECONDS
// 1. Added 'async' here so 'await' works
socket.on("start_mission", async ({ wallCode, durationSeconds }) => {
  const finishAt = Date.now() + (durationSeconds * 1000); 
  
  // 2. Update DB to 'active' immediately when mission starts
  try {
    await Wall.findOneAndUpdate({ wallCode }, { status: 'active', isStarted: true });
  } catch (err) {
    console.error("DB Error on start:", err);
  }

  // 3. Confirm to clients
  io.to(wallCode).emit("mission_start_confirmed", { finishAt, durationSeconds });

  // 4. THE TIMER: Wait for the duration, then execute the finish logic
  setTimeout(async () => {
    console.log(`🏁 Time is up for room ${wallCode}!`);
    
    // Tell clients to stop drawing and start reveal
    io.to(wallCode).emit('mission_ended');

    try {
      await Wall.findOneAndUpdate(
        { wallCode: wallCode }, 
        { 
          status: 'finished',
          isStarted: false, 
          endedAt: Date.now() 
        }
      );
      console.log(`✅ Wall ${wallCode} marked as FINISHED.`);
    } catch (err) {
      console.error("❌ Failed to update wall status:", err.message);
    }
  }, durationSeconds * 1000); // This tells the server to wait exactly X seconds
});

socket.on('send_stroke', async (data) => {
  // 1. Keep the real-time sync (what you already have)
  socket.to(data.wallCode).emit('receive_stroke', data);

  // 2. Save to Database for the timelapse
  try {
    await Stroke.create({
      wallCode: data.wallCode,
      artistName: data.artistName,
      brushSize: data.brushSize,
      capType: data.capType,
      color: data.color,
      points: data.points,
      timestamp: Date.now() 
    });
  } catch (err) {
    console.error("Failed to record stroke:", err);
  }
});

// server.js
// socket.on('send_stroke', async (data) => {
//   // 1. Check the data quality in the terminal
//   console.log(`🖌️  Stroke Received: ${data.artistName} on ${data.wallCode}`);
//   console.log(`   🎨 Color: ${data.color} | Cap: ${data.capType}`);
//   console.log(`   📍 Points: ${data.points.length} coordinates`);

//   // 2. Broadcast
//   socket.to(data.wallCode).emit('receive_stroke', data);

//   // 3. Save
//   try {
//     await Stroke.create(data); 
//     // Since 'data' keys now match Schema keys exactly, we can just pass the whole object!
//   } catch (err) {
//     console.error("❌ DB Save Error:", err.message);
//   }
// });

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
});//end of socketConnection
}