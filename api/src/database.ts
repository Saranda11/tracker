import mongoose from "mongoose";
import { config } from "./config";
import logger from "./logger";

const MAX_RETRIES = 5;
const RETRY_INTERVAL = 5000; // 5 seconds

export class Database {
  private static instance: Database;
  private retryCount = 0;
  private isConnected = false;

  private constructor() {
    this.initializeMongoose();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private initializeMongoose() {
    // Set mongoose options
    mongoose.set("strictQuery", true);
    
    // Configure connection pool
    const poolOptions = {
      maxPoolSize: 100,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      family: 4, // Use IPv4
    };

    // Handle connection events
    mongoose.connection.on("connected", () => {
      this.isConnected = true;
      logger.info("MongoDB connection established");
    });

    mongoose.connection.on("error", (err) => {
      this.isConnected = false;
      logger.error("MongoDB connection error:", err);
      this.retryConnection();
    });

    mongoose.connection.on("disconnected", () => {
      this.isConnected = false;
      logger.warn("MongoDB disconnected. Attempting to reconnect...");
      this.retryConnection();
    });

    // Handle process termination
    process.on("SIGINT", this.gracefulShutdown.bind(this));
    process.on("SIGTERM", this.gracefulShutdown.bind(this));
  }

  public async connect(): Promise<void> {
    try {
      if (!config.database.uri) {
        throw new Error("Database URI is not defined");
      }

      await mongoose.connect(config.database.uri, {
        ...config.database.options,
        maxPoolSize: 100,
        minPoolSize: 5,
        socketTimeoutMS: 45000,
        serverSelectionTimeoutMS: 5000,
        family: 4,
      });

      this.retryCount = 0; // Reset retry count on successful connection
    } catch (error) {
      logger.error("Failed to connect to MongoDB:", error);
      this.retryConnection();
    }
  }

  private async retryConnection(): Promise<void> {
    if (this.retryCount < MAX_RETRIES && !this.isConnected) {
      this.retryCount++;
      logger.info(`Retrying connection... Attempt ${this.retryCount} of ${MAX_RETRIES}`);
      
      await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
      await this.connect();
    } else if (this.retryCount >= MAX_RETRIES) {
      logger.error(`Failed to connect to MongoDB after ${MAX_RETRIES} attempts`);
      process.exit(1);
    }
  }

  private async gracefulShutdown(): Promise<void> {
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed through app termination");
      process.exit(0);
    } catch (error) {
      logger.error("Error during MongoDB connection closure:", error);
      process.exit(1);
    }
  }

  public getConnection(): mongoose.Connection {
    return mongoose.connection;
  }

  public isConnectedToDatabase(): boolean {
    return this.isConnected;
  }
} 