import { Request } from "express";

// Extend Express Request to include user information
declare module "express-serve-static-core" {
  interface Request {
    user: {
      id: string;
      // Add other user properties if needed
    };
    file?: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer?: Buffer;
    };
  }
}
