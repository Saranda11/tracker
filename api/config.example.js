// Configuration Example
// Copy this file to .env and update the values

module.exports = {
  // Environment Configuration
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5000,

  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/expense-tracker",

  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random",

  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS || 900000,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS || 100,

  // File Upload Configuration
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5000000,
  UPLOAD_PATH: process.env.UPLOAD_PATH || "uploads/",

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
};

// Environment Variables to Set:
// Create a .env file in the root directory with the following variables:
/*
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=5000000
UPLOAD_PATH=uploads/
LOG_LEVEL=info
*/
