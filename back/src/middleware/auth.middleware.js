const { verifyToken } = require('../utils/jwt.util');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Middleware para verificar JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        error: 'Access denied',
        message: 'User not found or inactive'
      });
    }

    // Add user info to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
};

/**
 * Middleware para verificar permisos específicos
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      const userPermissions = req.user?.role?.permissions || [];
      
      if (!Array.isArray(userPermissions) || !userPermissions.includes(permission)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          message: `Required permission: ${permission}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        error: 'Permission check failed',
        message: error.message
      });
    }
  };
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (roleName) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role?.name;
      
      if (!userRole || userRole !== roleName) {
        return res.status(403).json({
          error: 'Insufficient privileges',
          message: `Required role: ${roleName}`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        error: 'Role check failed',
        message: error.message
      });
    }
  };
};

/**
 * Middleware opcional - no falla si no hay token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              permissions: true
            }
          }
        }
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        };
      }
    }

    next();
  } catch (error) {
    // No fallar si hay error en token opcional
    next();
  }
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  optionalAuth
};