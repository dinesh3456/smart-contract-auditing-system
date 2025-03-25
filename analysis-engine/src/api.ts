// @ts-ignore
import express, { Request, Response } from "express";
import cors from "cors";
import { SecurityScanner, GasOptimizer, SmartContractAnalyzer } from "./index";

// Create Express app
const app = express();
const PORT = process.env.PORT || 5001;

// Configure middleware
app.use(express.json({ limit: "5mb" }));
app.use(cors());

// Define interfaces
interface AnalysisRequest {
  sourceCode: string;
  fileName?: string;
  contractName?: string;
}

interface AnalysisResponse {
  success: boolean;
  contractName: string;
  vulnerabilities: any[];
  gasIssues: any[];
  overallRiskRating: string;
  timestamp: string;
  error?: string;
}

interface ValidationRequest {
  sourceCode: string;
  fileName?: string;
  contractName?: string;
}

interface ValidationResponse {
  success: boolean;
  isValid: boolean;
  message: string;
  error?: string;
}

/**
 * Analyze a smart contract
 */
export async function analyzeContract(
  request: AnalysisRequest
): Promise<AnalysisResponse> {
  try {
    const {
      sourceCode,
      fileName = "Contract.sol",
      contractName = "Unknown",
    } = request;

    if (!sourceCode) {
      return {
        success: false,
        contractName,
        vulnerabilities: [],
        gasIssues: [],
        overallRiskRating: "Unknown",
        timestamp: new Date().toISOString(),
        error: "Source code is required",
      };
    }

    // Run security scan
    const securityScanner = new SecurityScanner(sourceCode, fileName);
    const vulnerabilities = securityScanner.scan();

    // Run gas optimization
    const gasOptimizer = new GasOptimizer(sourceCode, fileName);
    const gasIssues = gasOptimizer.analyze();

    // Determine risk level
    let overallRiskRating = "Low";
    if (vulnerabilities.some((v) => v.severity === "Critical")) {
      overallRiskRating = "Critical";
    } else if (vulnerabilities.some((v) => v.severity === "High")) {
      overallRiskRating = "High";
    } else if (vulnerabilities.some((v) => v.severity === "Medium")) {
      overallRiskRating = "Medium";
    }

    return {
      success: true,
      contractName,
      vulnerabilities,
      gasIssues,
      overallRiskRating,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error analyzing contract:", error);
    return {
      success: false,
      contractName: request.contractName || "Unknown",
      vulnerabilities: [],
      gasIssues: [],
      overallRiskRating: "Unknown",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Validate if a contract is valid Solidity
 */
export function validateContract(
  request: ValidationRequest
): ValidationResponse {
  try {
    const {
      sourceCode,
      fileName = "Contract.sol",
      contractName = "Unknown",
    } = request;

    if (!sourceCode) {
      return {
        success: false,
        isValid: false,
        message: "Source code is required",
      };
    }

    const analyzer = new SmartContractAnalyzer(
      sourceCode,
      contractName,
      fileName
    );
    const isValid = analyzer.isValidSolidity();

    return {
      success: true,
      isValid,
      message: isValid ? "Valid Solidity code" : "Invalid Solidity code",
    };
  } catch (error) {
    console.error("Error validating contract:", error);
    return {
      success: false,
      isValid: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

// API Endpoints
// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "healthy" });
});

// Analyze contract endpoint
app.post("/api/analyze", async (req: Request, res: Response) => {
  try {
    const result = await analyzeContract(req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Error in analyze endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Validate contract endpoint
app.post("/api/validate", (req: Request, res: Response) => {
  try {
    const result = validateContract(req.body);
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error("Error in validate endpoint:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Analysis Engine server running on port ${PORT}`);
});

// For module usage
export default app;
