import * as fs from "fs";
import * as path from "path";
import solc from "solc";
import { SecurityScanner } from "./analyzers/SecurityScanner";
import { GasOptimizer } from "./analyzers/GasOptimizer";

export interface AnalysisResult {
  contractName: string;
  vulnerabilities: Vulnerability[];
  gasIssues: GasIssue[];
  codeQuality: CodeQualityIssue[];
  overallRiskScore: number;
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

export class SmartContractAnalyzer {
  private sourceCode: string;
  private contractName: string;

  constructor(sourceCode: string, contractName: string) {
    this.sourceCode = sourceCode;
    this.contractName = contractName;
  }

  /**
   * Compile the smart contract
   */
  private compile(): any {
    const input = {
      language: "Solidity",
      sources: {
        [this.contractName]: {
          content: this.sourceCode,
        },
      },
      settings: {
        outputSelection: {
          "*": {
            "*": ["*"],
          },
        },
      },
    };

    try {
      const output = JSON.parse(solc.compile(JSON.stringify(input)));

      if (output.errors) {
        const hasError = output.errors.some(
          (error: any) => error.severity === "error"
        );
        if (hasError) {
          throw new Error(
            "Compilation failed: " + JSON.stringify(output.errors)
          );
        }
      }

      return output;
    } catch (error) {
      console.error("Compilation error:", error);
      throw error;
    }
  }

  /**
   * Run a basic analysis on the smart contract
   */
  public analyze(): AnalysisResult {
    // Compile the contract
    const compiledContract = this.compile();

    // Placeholder results - in a real implementation,
    // this would include multiple specialized analyzers
    return {
      contractName: this.contractName,
      vulnerabilities: this.detectVulnerabilities(),
      gasIssues: this.detectGasIssues(),
      codeQuality: this.detectCodeQualityIssues(),
      overallRiskScore: this.calculateRiskScore(),
    };
  }

  /**
   * Detect common vulnerabilities
   * This is a placeholder - real implementation would include various
   * vulnerability detection algorithms
   */
  private detectVulnerabilities(): Vulnerability[] {
    const securityScanner = new SecurityScanner(
      this.sourceCode,
      this.contractName
    );

    // Convert SecurityScanner findings to the expected Vulnerability format
    return securityScanner.scan().map((finding) => {
      return {
        id: finding.id,
        name: finding.name || "Security Issue",
        description: finding.description,
        severity:
          finding.severity ||
          ("Medium" as
            | "Critical"
            | "High"
            | "Medium"
            | "Low"
            | "Informational"),
        location: {
          file: finding.location.file || this.contractName,
          line: finding.location.line || 0,
          column: finding.location.column,
        },
        details: finding.details || finding.description,
        recommendation:
          finding.recommendation ||
          "Review this section of code for security issues.",
      };
    });
  }

  /**
   * Detect gas optimization issues
   */
  private detectGasIssues(): GasIssue[] {
    const gasOptimizer = new GasOptimizer(this.sourceCode, this.contractName);

    // First get the raw result
    const rawIssues = gasOptimizer.analyze();

    // Then map it with proper type safety
    return rawIssues.map((issue: any) => {
      // Ensure all required properties are present and properly typed
      const gasIssue: GasIssue = {
        id: issue.id || `gas-${Math.random().toString(36).substring(2, 9)}`,
        description: issue.description || "Gas optimization opportunity",
        location: {
          file:
            issue.location && issue.location.file
              ? issue.location.file
              : this.contractName,
          line:
            issue.location && typeof issue.location.line === "number"
              ? issue.location.line
              : 0,
          column:
            issue.location && typeof issue.location.column === "number"
              ? issue.location.column
              : undefined,
        },
        potential_savings:
          typeof issue.potential_savings === "string"
            ? issue.potential_savings
            : "Unknown",
        recommendation:
          issue.recommendation ||
          "Review this code section for gas optimization.",
      };

      return gasIssue;
    });
  }

  /**
   * Detect code quality issues
   */
  private detectCodeQualityIssues(): CodeQualityIssue[] {
    // Placeholder for code quality issue detection
    return [];
  }

  /**
   * Calculate an overall risk score for the contract
   */
  private calculateRiskScore(): number {
    // Placeholder for risk score calculation
    return 0;
  }
}

// Example usage:
// const analyzer = new SmartContractAnalyzer(contractSourceCode, 'MyContract');
// const analysisResult = analyzer.analyze();
