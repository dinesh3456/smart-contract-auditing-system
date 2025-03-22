// src/index.ts
import app from "./app";
import mongoose from "mongoose";
import { logger } from "./utils/logger";

// Import workers to ensure they're running
import "./workers/analysis.worker";
import "./workers/report.worker";

// Get port from environment or use default
const port = process.env.PORT || 5000;
const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/smart-contract-audit";

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled promise rejection:", reason);
});

// Connect to MongoDB
mongoose
  .connect(mongoUri)
  .then(() => {
    logger.info("Connected to MongoDB");

    // Start the server
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Handle graceful shutdown
    const gracefulShutdown = () => {
      logger.info("Shutting down gracefully...");
      server.close(async () => {
        try {
          await mongoose.connection.close();
          logger.info("MongoDB connection closed");
          process.exit(0);
        } catch (err) {
          logger.error("Error during shutdown:", err);
          process.exit(1);
        }
      });

      // Force shutdown if graceful shutdown takes too long
      setTimeout(() => {
        logger.error("Shutdown timeout, forcefully terminating");
        process.exit(1);
      }, 10000);
    };

    // Listen for termination signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
  })
  .catch((error) => {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  });

// Export app for testing
export default app;
