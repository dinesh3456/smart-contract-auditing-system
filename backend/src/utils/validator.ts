// backend/src/utils/validator.ts
import solc from "solc";
import { logger } from "./logger";
import * as parser from "@solidity-parser/parser";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

interface UserData {
  name?: string;
  email?: string;
  password?: string;
}

export function validateContract(sourceCode: string): ValidationResult {
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

  // If it passes basic checks, try to compile
  if (errors.length === 0) {
    try {
      const input = {
        language: "Solidity",
        sources: {
          "contract.sol": {
            content: sourceCode,
          },
        },
        settings: {
          outputSelection: {
            "*": {
              "*": ["abi", "evm.bytecode", "evm.deployedBytecode", "metadata"],
            },
          },
        },
      };

      const output = JSON.parse(solc.compile(JSON.stringify(input)));

      // Check for compilation errors
      if (output.errors) {
        const criticalErrors = output.errors.filter(
          (error: any) => error.severity === "error"
        );

        if (criticalErrors.length > 0) {
          return {
            isValid: false,
            errors: criticalErrors.map(
              (error: any) => error.formattedMessage || error.message
            ),
          };
        }
      }

      // Check for contract presence
      if (
        !output.contracts ||
        !output.contracts["contract.sol"] ||
        Object.keys(output.contracts["contract.sol"]).length === 0
      ) {
        return {
          isValid: false,
          errors: ["No contract found in source code"],
        };
      }
    } catch (error: any) {
      logger.error("Contract compilation error:", error);
      errors.push(`Compilation error: ${error.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateRegistration(userData: UserData): ValidationResult {
  const errors: string[] = [];

  // Name validation
  if (!userData.name) {
    errors.push("Name is required");
  } else if (userData.name.length < 2) {
    errors.push("Name must be at least 2 characters long");
  }

  // Email validation
  if (!userData.email) {
    errors.push("Email is required");
  } else if (!isValidEmail(userData.email)) {
    errors.push("Email format is invalid");
  }

  // Password validation
  if (!userData.password) {
    errors.push("Password is required");
  } else if (userData.password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  } else if (!/[A-Z]/.test(userData.password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (!/[0-9]/.test(userData.password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateLogin(userData: UserData): ValidationResult {
  const errors: string[] = [];

  // Email validation
  if (!userData.email) {
    errors.push("Email is required");
  }

  // Password validation
  if (!userData.password) {
    errors.push("Password is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
