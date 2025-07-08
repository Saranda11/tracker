const jwt = require("jsonwebtoken");
const User = require("../models/User");

// JWT secret key
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

/**
 * Generate JWT token
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} - JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "24h" });
};

/**
 * Verify JWT token middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: "Access token required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from database to ensure they still exist and are active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid token or user not active" });
    }

    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
};

/**
 * Check if user has required role
 * @param {string|Array} roles - Required role(s)
 * @returns {Function} - Middleware function
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role;
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: requiredRoles,
        current: userRole,
      });
    }

    next();
  };
};

/**
 * Check if user is admin
 */
const requireAdmin = requireRole("administrator");

/**
 * Check if user is employee or admin
 */
const requireEmployee = requireRole(["employee", "administrator"]);

/**
 * Check if user owns the resource or is admin
 * @param {string} resourceUserIdField - Field name containing the user ID (default: 'userId')
 * @returns {Function} - Middleware function
 */
const requireOwnershipOrAdmin = (resourceUserIdField = "userId") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    const currentUserId = req.user.userId;
    const isAdmin = req.user.role === "administrator";

    if (!isAdmin && resourceUserId !== currentUserId) {
      return res.status(403).json({
        error: "Access denied. You can only access your own resources.",
      });
    }

    next();
  };
};

/**
 * Rate limiting for authentication endpoints
 * @param {number} windowMs - Time window in milliseconds
 * @param {number} max - Maximum requests per window
 * @returns {Function} - Middleware function
 */
const authRateLimit = (windowMs = 15 * 60 * 1000, max = 5) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    const validRequests = userRequests.filter((time) => time > windowStart);
    requests.set(key, validRequests);

    if (validRequests.length >= max) {
      return res.status(429).json({
        error: "Too many authentication attempts. Please try again later.",
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    validRequests.push(now);
    next();
  };
};

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireAdmin,
  requireEmployee,
  requireOwnershipOrAdmin,
  authRateLimit,
};
