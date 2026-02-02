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
  "https://your-mural-frontend.onrender.com" // Replace with your frontend URL later
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true
}));

 
// 1. Wrap Express in an HTTP Server
const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: allowedOrigins, // Update this to match your Vite port!
    methods: ["GET", "POST", "DELETE", "PUT"],
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
 

 
app.use('/api', routes);

// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname,'./client/dist')));
//  app.get('/*', (req, res) => {
//   res.sendFile(path.join(__dirname, './client/dist/index.html'));
// });
// }

// Initialize the Socket Logic
socketHandler(io);

 db.once('open', () => {
  console.log('✅ Connected to MongoDB');
  // FIX: Added "0.0.0.0" to ensure Render can route traffic to the container
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`🌍 Mural Server & Socket.io running on port ${PORT}!`);
  });
});