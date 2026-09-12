const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

// Helper function to generate JWT Token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// 1. REGISTER USER: POST /api/auth/register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  // Input Validation
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  // Check if username or email already exists
  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, existingUser) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already in use.' });
    }

    try {
      // Hash password using bcryptjs
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insert new user into database
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ message: 'Failed to create user.', error: insertErr.message });
          }

          const newUser = { id: this.lastID, username, email };
          const token = generateToken(newUser);

          return res.status(201).json({
            message: 'User registered successfully!',
            token,
            user: newUser
          });
        }
      );
    } catch (hashErr) {
      return res.status(500).json({ message: 'Password hashing error.', error: hashErr.message });
    }
  });
});

// 2. LOGIN USER: POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Input Validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  // Find user by email
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare passwords with bcryptjs
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT Token
    const userPayload = { id: user.id, username: user.username, email: user.email };
    const token = generateToken(userPayload);

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: userPayload
    });
  });
});

// 3. GET CURRENT USER PROFILE: GET /api/auth/me (Protected Route)
router.get('/me', authenticateToken, (req, res) => {
  db.get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Database error.', error: err.message });
    }
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ user });
  });
});

module.exports = router;
