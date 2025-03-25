// @ts-ignore
import * as fs from "fs";
import * as path from "path";
import solc from "solc";
import {
  SecurityScanner,
  VulnerabilityFinding,
} from "./analyzers/SecurityScanner";
import {
  GasOptimizer,
  GasIssue as OptimizerGasIssue,
} from "./analyzers/GasOptimizer";

// Export interfaces to be used by other components
export interface AnalysisResult {
  contractName: string;
  sourceCode: string;
  vulnerabilities: Vulnerability[];
  gasIssues: GasIssue[];
  codeQuality: CodeQualityIssue[];
  overallRiskScore: number;
  riskLevel: "Critical" | "High" | "Medium" | "Low" | "Informational";
  compilerVersion?: string;
  compilerWarnings?: CompilerWarning[];
  timestamp: string;
}

export interface Vulnerability {
  id: string;
  name: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
  location: {
    file: string;
    line: number;
    column?: number;
  };
  details: string;
  recommendation: string;
}

export interface GasIssue {
  id: string;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  potential_savings: string;
  recommendation: string;
}

export interface CodeQualityIssue {
  id: string;
  description: string;
  location: {
    file: string;
    line: number;
    column?: number;
  };
  recommendation: string;
}

export interface CompilerWarning {
  message: string;
  type: string;
  severity: "error" | "warning" | "info";
  sourceLocation?: {
    file: string;
    start: number;
    end: number;
  };
}

export interface CompilationResult {
  success: boolean;
  output?: any;
  errors?: CompilerWarning[];
  contractNames?: string[];
}

export class SmartContractAnalyzer {
  private sourceCode: string;
  private contractName: string;
  private fileName: string;
  private solcVersion: string;
  private compilationResult: CompilationResult | null = null;

  constructor(
    sourceCode: string,
    contractName: string,
    fileName: string = "Contract.sol",
    solcVersion: string = ""
  ) {
    this.sourceCode = sourceCode;
    this.contractName = contractName;
    this.fileName = fileName;
    this.solcVersion = solcVersion;
  }

  /**
   * Compile the smart contract
   */
  private compile(): CompilationResult {
    const input = {
      language: "Solidity",
      sources: {
        [this.fileName]: {
          content: this.sourceCode,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    };

    try {
      // Compile the contract
      const output = JSON.parse(solc.compile(JSON.stringify(input)));

      // Check for errors
      if (output.errors) {
        const errors = output.errors.map((error: any) => ({
          message: error.message || "Unknown error",
          type: error.type || "Unknown",
          severity: error.severity || "error",
          sourceLocation: error.sourceLocation,
        }));

        const hasError = errors.some(
          (error: CompilerWarning) => error.severity === "error"
        );

        if (hasError) {
          return {
            success: false,
            errors,
          };
        }

        // Compilation succeeded with warnings
        return {
          success: true,
          output,
          errors: errors.filter((e: CompilerWarning) => e.severity !== "error"),
          contractNames: this.extractContractNames(output),
        };
      }

      // Compilation succeeded without errors
      return {
        success: true,
        output,
        contractNames: this.extractContractNames(output),
      };
    } catch (error) {
      console.error("Compilation error:", error);
      return {
        success: false,
        errors: [
          {
            message:
              error instanceof Error
                ? error.message
                : "Unknown error during compilation",
            type: "CompilationError",
            severity: "error",
          },
        ],
      };
    }
  }

  /**
   * Extract contract names from compilation output
   */
  private extractContractNames(output: any): string[] {
    const contractNames: string[] = [];

    if (output.contracts) {
      for (const fileName in output.contracts) {
        for (const contractName in output.contracts[fileName]) {
          contractNames.push(contractName);
        }
      }
    }

    return contractNames;
  }

  /**
   * Check if source code is valid Solidity
   */
  public isValidSolidity(): boolean {
    try {
      const result = this.compile();
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Run a comprehensive analysis on the smart contract
   */
  public analyze(): AnalysisResult {
    // Compile the contract if not already compiled
    if (!this.compilationResult) {
      this.compilationResult = this.compile();

      if (!this.compilationResult.success) {
        throw new Error(
          "Contract compilation failed. Cannot proceed with analysis."
        );
      }
    }

    // Run security analysis
    const vulnerabilities = this.detectVulnerabilities();

    // Run gas optimization analysis
    const gasIssues = this.detectGasIssues();

    // Run code quality analysis
    const codeQuality = this.detectCodeQualityIssues();

    // Calculate risk score
    const riskScore = this.calculateRiskScore(vulnerabilities);

    // Determine overall risk level
    const riskLevel = this.determineRiskLevel(riskScore, vulnerabilities);

    // Get compiler version from solc
    let compilerVersion = this.solcVersion || solc.version();
    if (typeof compilerVersion === "object" && compilerVersion.version) {
      compilerVersion = compilerVersion.version;
    }

    // Return comprehensive analysis result
    return {
      contractName: this.contractName,
      sourceCode: this.sourceCode,
      vulnerabilities,
      gasIssues,
      codeQuality,
      overallRiskScore: riskScore,
      riskLevel,
      compilerVersion: compilerVersion as string,
      compilerWarnings: this.compilationResult.errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect common vulnerabilities
   */
  private detectVulnerabilities(): Vulnerability[] {
    const securityScanner = new SecurityScanner(this.sourceCode, this.fileName);

    // Convert SecurityScanner findings to the expected Vulnerability format
    return securityScanner.scan().map((finding: VulnerabilityFinding) => {
      return {
        id: finding.id,
        name: finding.name,
        description: finding.description,
        severity: finding.severity,
        location: {
          file: finding.location.file || this.fileName,
          line: finding.location.line,
          column: finding.location.column,
        },
        details: finding.details,
        recommendation: finding.recommendation,
      };
    });
  }

  /**
   * Detect gas optimization issues
   */
  private detectGasIssues(): GasIssue[] {
    const gasOptimizer = new GasOptimizer(this.sourceCode, this.fileName);

    // Get the optimizer issues
    const optimizerIssues = gasOptimizer.analyze();

    // Map to our expected format
    return optimizerIssues.map((issue: OptimizerGasIssue) => {
      return {
        id: issue.id,
        description: issue.description,
        location: {
          file: issue.location.file || this.fileName,
          line: issue.location.line,
          column: issue.location.column,
        },
        potential_savings: issue.gasSaved, // Rename field from gasSaved to potential_savings
        recommendation: issue.recommendation,
      };
    });
  }

  /**
   * Detect code quality issues
   */
  private detectCodeQualityIssues(): CodeQualityIssue[] {
    // This is a placeholder for future implementation
    // In a real implementation, this would analyze code style, best practices, etc.
    return [];
  }

  /**
   * Calculate an overall risk score for the contract
   * Returns a score between 0 (no risk) and 100 (highest risk)
   */
  private calculateRiskScore(vulnerabilities: Vulnerability[]): number {
    // Weight vulnerabilities by severity
    const weights = {
      Critical: 100,
      High: 50,
      Medium: 20,
      Low: 5,
      Informational: 1,
    };

    // Count vulnerabilities by severity
    const counts = {
      Critical: vulnerabilities.filter((v) => v.severity === "Critical").length,
      High: vulnerabilities.filter((v) => v.severity === "High").length,
      Medium: vulnerabilities.filter((v) => v.severity === "Medium").length,
      Low: vulnerabilities.filter((v) => v.severity === "Low").length,
      Informational: vulnerabilities.filter(
        (v) => v.severity === "Informational"
      ).length,
    };

    // Calculate weighted score
    let score = 0;
    let maxScore = 100;

    score += Math.min(100, counts.Critical * weights.Critical);
    if (counts.Critical === 0) {
      score += Math.min(70, counts.High * weights.High);
      if (counts.High === 0) {
        score += Math.min(40, counts.Medium * weights.Medium);
        if (counts.Medium === 0) {
          score += Math.min(20, counts.Low * weights.Low);
          if (counts.Low === 0) {
            score += Math.min(5, counts.Informational * weights.Informational);
          }
        }
      }
    }

    // Ensure score is between 0 and 100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Determine the overall risk level based on the risk score and vulnerabilities
   */
  private determineRiskLevel(
    score: number,
    vulnerabilities: Vulnerability[]
  ): "Critical" | "High" | "Medium" | "Low" | "Informational" {
    // Check for critical vulnerabilities first
    if (vulnerabilities.some((v) => v.severity === "Critical")) {
      return "Critical";
    }

    // Then determine by score
    if (score >= 75) {
      return "Critical";
    } else if (score >= 50) {
      return "High";
    } else if (score >= 25) {
      return "Medium";
    } else if (score >= 5) {
      return "Low";
    } else {
      return "Informational";
    }
  }
}

// Export main classes and interfaces
export { SecurityScanner, VulnerabilityFinding, GasOptimizer };

// Helper function for CLI usage
export function analyzeContract(filePath: string): AnalysisResult {
  try {
    const sourceCode = fs.readFileSync(filePath, "utf8");
    const fileName = path.basename(filePath);
    const contractName = fileName.replace(".sol", "");

    const analyzer = new SmartContractAnalyzer(
      sourceCode,
      contractName,
      fileName
    );
    return analyzer.analyze();
  } catch (error) {
    throw new Error(
      `Failed to analyze contract: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

// When run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please provide a path to a Solidity file");
    process.exit(1);
  }

  try {
    const result = analyzeContract(args[0]);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
