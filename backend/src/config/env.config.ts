import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

// Load environment variables
const envPath = path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  logger.info(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  logger.warn("No .env file found, using default environment");
}

// Required environment variables
const requiredVars = ["MONGODB_URI", "JWT_SECRET"];

// Check for missing env vars
const missing = requiredVars.filter((name) => !process.env[name]);
if (missing.length > 0) {
  logger.error(`Missing required environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

// Export config with defaults
export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  mongoUri: process.env.MONGODB_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  analysisEngineUrl:
    process.env.ANALYSIS_ENGINE_URL || "http://analysis-engine:5001",
  aiDetectorUrl: process.env.AI_DETECTOR_URL || "http://ai-detector:5002",
  reportsServiceUrl:
    process.env.REPORTS_SERVICE_URL || "http://reports-service:5003",
  reportsDir: process.env.REPORTS_DIR || path.join(__dirname, "../../reports"),
  environment: process.env.NODE_ENV || "development",
};
