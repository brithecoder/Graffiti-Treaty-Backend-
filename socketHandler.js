const { updateRoomCount } = require("./utils/helpers");
const Stroke = require("./models/Stroke");
const Wall = require("./models/Wall");
const wallSlots = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ A user connected:", socket.id);

    // --- JOIN WALL ---
    socket.on("join_wall", async (data) => {
      const rawCode = typeof data === "string" ? data : data.wallCode;
      const wallCode = rawCode?.trim().toUpperCase();
      const artistName = data.artistName || "Mystery Tagger";
      const muralName = data.muralName || "Untitled Mural";

      if (!wallCode) return;

      socket.join(wallCode);
      console.log(`👤 User ${artistName} joined room: ${wallCode}`);
      // If the wall doesn't exist yet, CREATE it!

      try {
        const wall = await Wall.findOne({ wallCode });
        if (!wall) {
          console.log(`✨ Wall record missing for ${wallCode}. Creating...`);
          wall = await Wall.create({
            wallCode: wallCode,
            status: "waiting", // Start in waiting mode
            muralName: muralName || "Untitled Mural",
          });
        }
        console.log(`WALL SEARCHED: ${wallCode} | STATUS: ${wall.status}`);
        // Late Joiner Sync
        if (wall && wall.status === "active") {
          console.log(">>> EMITTING already_started to:", socket.id);
          console.log(`Sending already_started to late joiner: ${artistName}`);
          socket.emit("already_started", {
            finishAt: wall.finishAt,
            durationSeconds: wall.timerDuration,
            muralName: wall.muralName,
          });
        } else {
          console.log(
            "Wall not active. Status is:",
            wall ? wall.status : "NULL",
          );
        }

        // 1. SLOT ASSIGNMENT
        if (!wallSlots[wallCode]) {
          wallSlots[wallCode] = new Array(30).fill(null);
        }
        let slotIndex = wallSlots[wallCode].indexOf(artistName);
        if (slotIndex === -1) {
          slotIndex = wallSlots[wallCode].indexOf(null);
          if (slotIndex !== -1) wallSlots[wallCode][slotIndex] = artistName;
        }

        // 2. Initial Data Load
        const existingStrokes = await Stroke.find({ wallCode });
        socket.emit("initial_canvas_load", {
          strokes: existingStrokes,
          slotIndex,
        });

        // 3. Update Everyone's Count
        setTimeout(() => updateRoomCount(io, wallCode), 100);
      } catch (err) {
        console.error("Join Wall Error:", err);
      }
    });

    // --- START MISSION ---
    socket.on("start_mission", async (data) => {
      const { wallCode, durationSeconds } = data;
      const finishAt = Date.now() + durationSeconds * 1000;

      try {
        await Wall.findOneAndUpdate(
          { wallCode },
          {
            status: "active",
            isStarted: true,
            finishAt: finishAt,
          },
        );
        console.log(`✅ DATABASE UPDATED: Wall ${wallCode} is now active.`);
        io.to(wallCode).emit("mission_start_confirmed", {
          finishAt,
          durationSeconds,
        });

        setTimeout(async () => {
          io.to(wallCode).emit("mission_ended");
          await Wall.findOneAndUpdate(
            { wallCode },
            { status: "finished", isStarted: false, endedAt: Date.now() },
          );
        }, durationSeconds * 1000);
      } catch (err) {
        console.error("Mission Start Error:", err);
      }
    });

    // --- STROKE LOGIC ---
    socket.on("send_stroke", async (data) => {
      socket.to(data.wallCode).emit("receive_stroke", data);
      try {
        await Stroke.create({
          ...data,
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error("Failed to record stroke:", err);
      }
    });

    // --- ROOM UPDATES ---
    socket.on("request_room_update", ({ wallCode }) => {
      updateRoomCount(io, wallCode);
    });

    // --- CLEAR QUADRANT ---
    socket.on("clear_quadrant", async ({ wallCode, artistName }) => {
      try {
        await Stroke.deleteMany({ wallCode: wallCode, artistName: artistName });
        socket.emit("quadrant_cleared_confirm");
      } catch (err) {
        console.error("Clear failed:", err);
      }
    });

    // --- DISCONNECT ---
    socket.on("disconnecting", () => {
      console.log("🔥 User disconnecting:", socket.id);
      socket.rooms.forEach((room) => {
        if (room !== socket.id) {
          setTimeout(() => updateRoomCount(io, room), 100);
        }
      });
    });
  }); // End of io.on('connection')
}; // End of module.exports
