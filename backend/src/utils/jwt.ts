// src/utils/jwt.ts
import jwt, { SignOptions } from "jsonwebtoken";

interface TokenPayload {
  id: string;
  email: string;
  name: string;
}

export const generateToken = (payload: TokenPayload): string => {
  const jwtSecret =
    process.env.JWT_SECRET || "your_jwt_secret_key_here_change_in_production";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d"; // Token expires in 7 days by default

  return jwt.sign(payload, jwtSecret, { expiresIn } as SignOptions);
};

// src/utils/logger.ts
import winston from "winston";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: logFormat,
  defaultMeta: { service: "smart-contract-audit-api" },
  transports: [
    // Write logs to console
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          ({ timestamp, level, message, service, ...meta }) => {
            return `${timestamp} [${service}] ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`;
          }
        )
      ),
    }),
    // Write logs to file
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
});

// If not in production, also log to console in a more readable format
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// src/utils/validator.ts
import { body, validationResult } from "express-validator";
import * as parser from "@solidity-parser/parser";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate user registration data
 */
export const validateRegistration = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Email validation
  if (!data.email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push("Invalid email format");
  }

  // Password validation
  if (!data.password) {
    errors.push("Password is required");
  } else if (data.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Name validation
  if (!data.name) {
    errors.push("Name is required");
  } else if (data.name.length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate login data
 */
export const validateLogin = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Email validation
  if (!data.email) {
    errors.push("Email is required");
  }

  // Password validation
  if (!data.password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate Solidity contract code
 */
export const validateContract = (sourceCode: string): ValidationResult => {
  const errors: string[] = [];

  if (!sourceCode) {
    errors.push("Contract source code is empty");
    return {
      isValid: false,
      errors,
    };
  }

  // Basic syntax validation
  try {
    parser.parse(sourceCode, { loc: true });
  } catch (error: any) {
    errors.push(`Solidity syntax error: ${error.message}`);
  }

  // Basic pragma check
  if (!sourceCode.includes("pragma solidity")) {
    errors.push("Missing pragma solidity directive");
  }

  // Check for contract definition
  if (!sourceCode.includes("contract ")) {
    errors.push("No contract definition found");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
