const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'maelza-erp-secret-key-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * Generate JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'maelza-erp'
  });
};

/**
 * Verify JWT token
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Generate refresh token (longer expiry)
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: '7d',
    issuer: 'maelza-erp'
  });
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken,
  JWT_SECRET
};