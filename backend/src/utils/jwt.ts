import jwt from "jsonwebtoken";
import { logger } from "./logger";

/**
 * Generate JWT token with user information
 */
export const generateToken = (payload: any): string => {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      logger.error("JWT_SECRET is missing in environment variables");
      throw new Error("JWT_SECRET is not configured");
    }

    // Set token to expire in 7 days
    return jwt.sign(payload, secret, { expiresIn: "7d" });
  } catch (error) {
    logger.error("Error generating JWT token:", error);
    throw error;
  }
};
