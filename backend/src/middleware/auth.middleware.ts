import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user.model";
import { logger } from "../utils/logger";
import { Types } from "mongoose";
import dotenv from "dotenv";

/// Make sure environment variables are loaded
dotenv.config();

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Log the whole auth header for debugging (remove in production)
    logger.debug(
      `Auth header: ${req.headers.authorization?.substring(0, 15)}...`
    );

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Log token format for debugging (remove in production)
    logger.debug(`Token format check: ${token.substring(0, 15)}...`);

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      logger.error("JWT_SECRET is not defined in environment variables");
      res
        .status(500)
        .json({ success: false, message: "Server configuration error" });
      return;
    }

    // Log that we're trying to verify with the secret
    logger.debug(
      `Verifying token with secret starting with: ${jwtSecret.substring(
        0,
        5
      )}...`
    );

    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    if (!decoded || !decoded.id) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    // Log decoded ID for debugging
    logger.debug(`Decoded user ID: ${decoded.id}`);

    // Check if user exists
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    // Add user ID to request object
    req.user = {
      id: decoded.id,
    };

    next();
  } catch (error) {
    // Provide more specific error messages for debugging
    if (error instanceof jwt.JsonWebTokenError) {
      logger.error("JWT Error:", error.message);
      res
        .status(401)
        .json({ success: false, message: "Invalid token: " + error.message });
    } else if (error instanceof jwt.TokenExpiredError) {
      logger.error("Token expired:", error);
      res.status(401).json({ success: false, message: "Token expired" });
    } else {
      // Log more details about the unknown error
      logger.error("Authentication error:", error);
      logger.error("Error type:", typeof error);
      logger.error("Error details:", JSON.stringify(error, null, 2));

      res
        .status(401)
        .json({ success: false, message: "Authentication failed" });
    }
  }
};

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get user from request (assuming it was set by authenticate middleware)
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (roles.includes(user.role)) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden: Insufficient permissions" });
    }
  };
};
