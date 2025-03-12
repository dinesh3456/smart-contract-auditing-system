import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/user.model";
import { logger } from "../utils/logger";
import { Types } from "mongoose";

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
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verify the token
    const jwtSecret =
      process.env.JWT_SECRET ||
      "default_jwt_secret_should_be_changed_in_production";
    const decoded = jwt.verify(token, jwtSecret) as { id: string };

    if (!decoded || !decoded.id) {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    // Check if user exists
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ success: false, message: "User not found" });
      return;
    }

    // Add user ID to request object
    req.user = {
      id: decoded.id, // Use the ID from the token instead
    };

    next();
  } catch (error) {
    logger.error("Authentication error:", error);
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};
