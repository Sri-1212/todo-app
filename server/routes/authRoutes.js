const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
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

  try {
    // Check if username or email already exists
    const checkUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (checkUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username or email already in use.' });
    }

    // Hash password using bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert user into PostgreSQL
    const insertResult = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    const newUser = insertResult.rows[0];
    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User registered successfully!',
      token,
      user: newUser
    });
  } catch (err) {
    return res.status(500).json({ message: 'Database error.', error: err.message });
  }
});

// 2. LOGIN USER: POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Input Validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    // Find user by email
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Compare passwords with bcryptjs
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const userPayload = { id: user.id, username: user.username, email: user.email };
    const token = generateToken(userPayload);

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: userPayload
    });
  } catch (err) {
    return res.status(500).json({ message: 'Database error.', error: err.message });
  }
});

// 3. GET CURRENT USER PROFILE: GET /api/auth/me (Protected Route)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Database error.', error: err.message });
  }
});

module.exports = router;
