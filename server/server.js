const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Database connection and tables
const db = require('./config/db');

// Import Routes
const authRoutes = require('./routes/authRoutes');

// Initialize Express Application
const app = express();

// Middlewares
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON body parsing for incoming requests

// Mount Routes
app.use('/api/auth', authRoutes);

// Basic Health Check Route
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
