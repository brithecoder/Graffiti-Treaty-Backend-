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


const allowedOrigins = [
  "http://localhost:5173", 
  "https://graffiti-treaty.netlify.app" 
];

app.use(cors({
  // Pass the array directly instead of using a function
  origin: allowedOrigins, 
  methods: ["GET", "POST", "DELETE", "PUT", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));


 
// 1. Wrap Express in an HTTP Server
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Update this to match your Vite port!
    methods: ["GET", "POST", "DELETE", "PUT"],
     credentials: true,
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 

 
app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.status(200).send('Awake');
});


// Initialize the Socket Logic
socketHandler(io);

 db.once('open', () => {
  console.log('✅ Connected to MongoDB');
  // FIX: Added "0.0.0.0" to ensure Render can route traffic to the container
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Mural Server & Socket.io running on port ${PORT}!`);
  });
});