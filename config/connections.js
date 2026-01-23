const mongoose = require('mongoose');

// Use the environment variable MONGODB_URI if it exists (for Heroku/Render)
// Otherwise, fall back to your local development database
const connectionString = 
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/graffitiWallDB';

mongoose.connect(connectionString);

// Export the connection object
module.exports = mongoose.connection;