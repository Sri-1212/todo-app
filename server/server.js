const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Database connection and tables
const db = require('./config/db');

// Initialize Express Application
const app = express();

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing (allows frontend to talk to backend)
app.use(express.json()); // Enable JSON body parsing for incoming HTTP requests

// Basic Health Check / Root Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend server is running smoothly!',
    timestamp: new Date().toISOString()
  });
});

// Configure Server Port
const PORT = process.env.PORT || 5000;

// Start Server
app.listen(PORT, () => {
  console.log(`\n=================================`);
  console.log(`🚀 Task Management Server Running!`);
  console.log(`🌐 Server URL: http://localhost:${PORT}`);
  console.log(`=================================\n`);
});
