
const { updateRoomCount } = require('./utils/helpers');
const Stroke = require('./models/Stroke');
const Wall = require("./models/Wall");
const wallSlots = {};

//  Socket.io Logic

module.exports = (io) => {
io.on('connection', (socket) => {
  console.log('⚡ A user connected:', socket.id);

  // Join a specific wall room based on wallCode
//   socket.on('join_wall', async (wallCode) => {
//     if (!wallCode) return;
//     socket.join(wallCode);
//   console.log(`👤 User ${artistName} joined room: ${wallCode}`);
//     // 1. SLOT ASSIGNMENT (Quadrant Logic)
//       if (!wallSlots[wallCode]) {
//         wallSlots[wallCode] = new Array(30).fill(null);
//       }

//       // If user is already in a slot (refresh), find it. Otherwise, find first empty.
//       let slotIndex = wallSlots[wallCode].indexOf(artistName);
//       if (slotIndex === -1) {
//         slotIndex = wallSlots[wallCode].indexOf(null);
//         if (slotIndex !== -1) {
//           wallSlots[wallCode][slotIndex] = artistName;
//         }
//       }
//       updateRoomCount(io, wallCode);  
//     try {
//         const existingStrokes = await Stroke.find({ wallCode }); // Corrected 'StrokeModel' to 'Stroke'
//         socket.emit("initial_canvas_load", { 
//           strokes: existingStrokes, 
//           slotIndex 
//         });
//       } catch (err) {
//         console.error("Failed to load initial strokes:", err);
//       } 
//   });
// FIX 1: Destructure the object here!
    socket.on('join_wall', async (data) => {
      // Handle both formats just in case
      const wallCode = typeof data === 'string' ? data : data.wallCode;
      const artistName = data.artistName || "Mysterious Tagger";

      if (!wallCode) return;

      socket.join(wallCode);
      console.log(`👤 User ${artistName} joined room: ${wallCode}`);

      // 1. SLOT ASSIGNMENT
      if (!wallSlots[wallCode]) {
        wallSlots[wallCode] = new Array(30).fill(null);
      }

      let slotIndex = wallSlots[wallCode].indexOf(artistName);
      if (slotIndex === -1) {
        slotIndex = wallSlots[wallCode].indexOf(null);
        if (slotIndex !== -1) {
          wallSlots[wallCode][slotIndex] = artistName;
        }
      }

      // FIX 2: Call this AFTER joining
      updateRoomCount(io, wallCode);  

      try {
        const existingStrokes = await Stroke.find({ wallCode });
        socket.emit("initial_canvas_load", { 
          strokes: existingStrokes, 
          slotIndex 
        });
      } catch (err) {
        console.error("Failed to load initial strokes:", err);
      } 
    });

 // Server-side updated for SECONDS
// 1. Added 'async' here so 'await' works
// socket.on("start_mission", async ({ wallCode, durationSeconds }) => {
//   const finishAt = Date.now() + (durationSeconds * 1000); 
  
//   // 2. Update DB to 'active' immediately when mission starts
//   try {
//     await Wall.findOneAndUpdate({ wallCode }, { status: 'active', isStarted: true });
//   } catch (err) {
//     console.error("DB Error on start:", err);
//   }

//   // 3. Confirm to clients
//   io.to(wallCode).emit("mission_start_confirmed", { finishAt, durationSeconds });

//   // 4. THE TIMER: Wait for the duration, then execute the finish logic
//   setTimeout(async () => {
//     console.log(`🏁 Time is up for room ${wallCode}!`);
    
//     // Tell clients to stop drawing and start reveal
//     io.to(wallCode).emit('mission_ended');

//     try {
//       await Wall.findOneAndUpdate(
//         { wallCode: wallCode }, 
//         { 
//           status: 'finished',
//           isStarted: false, 
//           endedAt: Date.now() 
//         }
//       );
//       console.log(`✅ Wall ${wallCode} marked as FINISHED.`);
//     } catch (err) {
//       console.error("❌ Failed to update wall status:", err.message);
//     }
//   }, durationSeconds * 1000); // This tells the server to wait exactly X seconds
// });

socket.on("start_mission", async (data) => {
      const { wallCode, durationSeconds } = data;
      const finishAt = Date.now() + (durationSeconds * 1000); 
      
      try {
        await Wall.findOneAndUpdate({ wallCode }, { status: 'active', isStarted: true });
        
        // Use io.to(wallCode) so EVERYONE gets the start signal
        io.to(wallCode).emit("mission_start_confirmed", { finishAt, durationSeconds });

        setTimeout(async () => {
          io.to(wallCode).emit('mission_ended');
          await Wall.findOneAndUpdate({ wallCode }, { status: 'finished', isStarted: false, endedAt: Date.now() });
        }, durationSeconds * 1000);
      } catch (err) {
        console.error("Mission Start Error:", err);
      }
    });

    // ... rest of your stroke/clear listeners
 
socket.on('send_stroke', async (data) => {
  // 1. Keep the real-time sync (what you already have)
  socket.to(data.wallCode).emit('receive_stroke', data);

  // 2. Save to Database for the timelapse
  try {
    await Stroke.create({
      ...data,
      timestamp: Date.now() 
    });
    console.log(`Saved stroke for ${data.wallCode}`);
  } catch (err) {
    console.error("Failed to record stroke:", err);
  }
});


  socket.on("clear_quadrant", async ({ wallCode, artistName }) => {
  try {
    // 1. Delete only the strokes belonging to THIS artist on THIS wall
    await Stroke.deleteMany({ wallCode: wallCode, artistName: artistName });
    
    // 2. Tell the user's client it's done so they can wipe their local p5 screen
    socket.emit("quadrant_cleared_confirm");
    
    console.log(`Cleared strokes for artist: ${artistName} on wall: ${wallCode}`);
  } catch (err) {
    console.error("Clear failed:", err);
  }
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

});//end of socketConnection
}