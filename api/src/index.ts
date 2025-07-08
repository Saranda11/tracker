import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config";
import { Database } from "./database";
import logger from "./logger";

// Import routes (assuming they will be converted to TypeScript or work with CommonJS)
const userRoutes = require("./routes/userRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const authRoutes = require("./routes/authRoutes");

class Server {
  private app: express.Application;
  private database: Database;

  constructor() {
    this.app = express();
    this.database = Database.getInstance();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: true,
      })
    );

    // Rate limiting
    const limiter = rateLimit({
      windowMs: config.rateLimit.windowMs,
      max: config.rateLimit.maxRequests,
      message: {
        error: "Too many requests from this IP, please try again later.",
      },
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use("/api/auth", authRoutes);
    this.app.use("/api/users", userRoutes);
    this.app.use("/api/expenses", expenseRoutes);

    // Health check endpoint
    this.app.get("/health", (req, res) => {
      res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        database: this.database.isConnectedToDatabase(),
        environment: config.env,
      });
    });

    // API documentation endpoint
    this.app.get("/api", (req, res) => {
      res.json({
        message: "Expense Tracker API",
        version: "1.0.0",
        endpoints: {
          auth: "/api/auth",
          users: "/api/users",
          expenses: "/api/expenses",
          health: "/health",
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error("Error occurred:", err);

      // Don't expose error details in production
      const errorMessage =
        config.env === "production" ? "Something went wrong!" : err.message || "Something went wrong!";

      res.status(err.status || 500).json({
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    });

    // 404 handler
    this.app.use("*", (req, res) => {
      res.status(404).json({
        error: "Route not found",
        timestamp: new Date().toISOString(),
      });
    });
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await this.database.connect();

      // Start server
      this.app.listen(config.port, () => {
        logger.info(`Server running on port ${config.port}`);
        logger.info(`Environment: ${config.env}`);
        logger.info(`Database connected: ${this.database.isConnectedToDatabase()}`);
      });
    } catch (error) {
      logger.error("Failed to start server:", error);
      process.exit(1);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start server
const server = new Server();
server.start().catch((error) => {
  logger.error("Server startup failed:", error);
  process.exit(1);
});

export default server;
