import dotenv from "dotenv";

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  uri: string;
  options: {
    useNewUrlParser?: boolean;
    useUnifiedTopology?: boolean;
    maxPoolSize?: number;
    minPoolSize?: number;
    socketTimeoutMS?: number;
    serverSelectionTimeoutMS?: number;
    family?: number;
  };
}

interface Config {
  // Environment Configuration
  env: string;
  port: number;

  // Database Configuration
  database: DatabaseConfig;

  // JWT Configuration
  jwt: {
    secret: string;
  };

  // CORS Configuration
  cors: {
    origin: string;
  };

  // Rate Limiting
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };

  // File Upload Configuration
  upload: {
    maxFileSize: number;
    uploadPath: string;
  };

  // Logging Configuration
  logging: {
    level: string;
  };
}

export const config: Config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),

  database: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/expense-tracker",
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 100,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4,
    },
  },

  jwt: {
    secret: process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production-make-it-long-and-random",
  },

  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10),
  },

  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "5000000", 10),
    uploadPath: process.env.UPLOAD_PATH || "uploads/",
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};
