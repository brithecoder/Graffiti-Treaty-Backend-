// utils/helpers.js

const generateShortCode = (length = 4) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, or 1
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Broadcasts the current number of connected sockets in a room
 * @param {Object} io - The Socket.io server instance
 * @param {string} wallCode - The specific room ID
 */

const updateRoomCount = (io, wallCode) => {
  if (!io || !wallCode) return;

  const room = io.sockets.adapter.rooms.get(wallCode);
  const count = room ? room.size : 0;
  
  io.to(wallCode).emit('room_count_update', count);
  console.log(`Room ${wallCode} now has ${count} artists.`);
};


module.exports = { generateShortCode, updateRoomCount };