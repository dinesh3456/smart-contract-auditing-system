// src/middleware/upload.middleware.ts
import multer from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid";

// Define storage location and filename strategy
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    const uploadsDir =
      process.env.UPLOADS_DIR || path.join(__dirname, "../../uploads");

    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Create user-specific directory based on authenticated user
    if (req.user && req.user.id) {
      const userDir = path.join(uploadsDir, req.user.id);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
      }
      cb(null, userDir);
    } else {
      // Fallback to temporary directory if user is not authenticated
      const tempDir = path.join(uploadsDir, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    }
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Create unique filename with original extension
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    cb(null, uniqueFilename);
  },
});

// File filter to only allow Solidity files
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept Solidity files (.sol)
  const allowedExtensions = [".sol"];
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Only Solidity (.sol) files are allowed"));
  }
};

// Configure multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
