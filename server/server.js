const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Database connection and tables
const pool = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

// Initialize Express Application
const app = express();

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing for frontend
app.use(express.json()); // Enable JSON body parsing for incoming requests

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Backend server is running smoothly on Render / PostgreSQL!',
    timestamp: new Date().toISOString()
  });
});

// Configure Server Port and Host for Render Deployment
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Start Server Listening on 0.0.0.0
app.listen(PORT, HOST, () => {
  console.log(`\n=================================`);
  console.log(`🚀 Task Management Server Running!`);
  console.log(`🌐 Server URL: http://${HOST}:${PORT}`);
  console.log(`=================================\n`);
});
