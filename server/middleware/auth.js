const jwt = require('jsonwebtoken');

// Middleware to verify JWT authentication token
function authenticateToken(req, res, next) {
  // Extract token from Authorization header: "Bearer <token>"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token is required.' });
  }

  try {
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
}

module.exports = authenticateToken;
