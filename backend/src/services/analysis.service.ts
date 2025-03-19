import {
  Analysis,
  IAnalysis,
  AnalysisStatus,
  RiskRating,
} from "../models/analysis.model";
import { Contract } from "../models/contract.model";
import { logger } from "../utils/logger";
import axios from "axios";
import { analysisQueue } from "../config/queue.config";
import { ApiError } from "../utils/error";
import { Types } from "mongoose"; // Import Types from mongoose

// Define interfaces for analyzers since we can't import them
interface SecurityVulnerability {
  name: string;
  severity: string;
  recommendation: string;
}

interface GasIssue {
  id: string;
  description: string;
  location: {
    line: number;
    column?: number;
    file?: string;
  };
  gasSaved: string;
  recommendation: string;
}

interface ComplianceResult {
  compliant: boolean;
  recommendations: string[];
}

interface AnomalyResult {
  isAnomaly: boolean;
  confidence: number;
  description: string;
  line?: number;
  function?: string;
}

interface AnalysisOptions {
  securityScan: boolean;
  gasOptimization: boolean;
  complianceCheck: boolean;
  anomalyDetection: boolean;
  standards: string[];
}

// Interface for resources that need to be cleaned up
interface DisposableResource {
  dispose?: () => void;
  cleanup?: () => void;
  close?: () => void;
}

// Define a basic security scanner class for local use
class SecurityScanner implements DisposableResource {
  private scanner: any;

  constructor(private readonly sourceCode: string) {
    // Import the actual implementation from analysis-engine
    const {
      SecurityScanner: EngineScanner,
    } = require("../../analysis-engine/src/analyzers/SecurityScanner");
    this.scanner = new EngineScanner(sourceCode);
  }

  scan(): SecurityVulnerability[] {
    return this.scanner.scan().map((vuln: any) => ({
      id: vuln.id,
      name: vuln.name,
      description: vuln.description,
      severity: vuln.severity,
      location: vuln.location,
      details: vuln.details,
      recommendation: vuln.recommendation,
    }));
  }

  dispose() {
    // Explicitly cleanup the scanner resources
    if (this.scanner && typeof this.scanner.dispose === "function") {
      this.scanner.dispose();
    }
  }
}

class GasOptimizer implements DisposableResource {
  private optimizer: any;

  constructor(private readonly sourceCode: string) {
    const {
      GasOptimizer: EngineOptimizer,
    } = require("../../analysis-engine/src/analyzers/GasOptimizer");
    this.optimizer = new EngineOptimizer(sourceCode);
  }

  analyze(): GasIssue[] {
    return this.optimizer.analyze();
  }

  dispose() {
    // Cleanup the optimizer resources
    if (this.optimizer && typeof this.optimizer.dispose === "function") {
      this.optimizer.dispose();
    }
  }
}

// Define a basic compliance checker class for local use
class ComplianceChecker implements DisposableResource {
  private sourceCode: string;
  private standards: string[];
  private checkers: any[] = [];

  constructor(sourceCode: string, standards: string[]) {
    this.sourceCode = sourceCode;
    this.standards = standards;
  }

  checkCompliance(): any[] {
    const results = [];

    for (const standard of this.standards) {
      try {
        let checker;
        if (standard === "ERC20") {
          const {
            ERC20Checker,
          } = require("../../compliance-checker/src/standards/ERC20Checker");
          checker = new ERC20Checker(this.sourceCode);
        } else if (standard === "ERC721") {
          const {
            ERC721Checker,
          } = require("../../compliance-checker/src/standards/ERC721Checker");
          checker = new ERC721Checker(this.sourceCode);
        } else {
          // Skip unknown standards
          logger.warn(
            `Unknown standard: ${standard}, skipping compliance check`
          );
          continue;
        }

        this.checkers.push(checker);
        const result = checker.checkCompliance();
        result.standard = standard;
        results.push(result);
      } catch (error) {
        logger.error(`Error checking compliance with ${standard}:`, error);
        results.push({
          standard,
          compliant: false,
          details: `Error checking compliance: ${
            error instanceof Error ? error.message : String(error)
          }`,
          recommendation:
            "Please check your contract implementation against the standard specification.",
        });
      }
    }

    return results;
  }

  dispose() {
    // Clean up all checkers
    for (const checker of this.checkers) {
      if (checker && typeof checker.dispose === "function") {
        checker.dispose();
      }
    }
    this.checkers = [];
  }
}

class AnomalyDetector implements DisposableResource {
  private detector: any;
  private aiDetectorUrl: string;

  constructor(private readonly sourceCode: string) {
    this.aiDetectorUrl =
      process.env.AI_DETECTOR_URL || "http://ai-detector:5002/api/analyze";
  }

  async detectAnomalies(): Promise<AnomalyResult[]> {
    try {
      const response = await axios.post(
        this.aiDetectorUrl,
        { sourceCode: this.sourceCode },
        { timeout: 30000 }
      );

      if (response.data && response.data.anomalies) {
        return response.data.anomalies.map((anomaly: any) => ({
          isAnomaly: true,
          confidence: anomaly.confidence || 0.5,
          description: anomaly.description || "Unknown anomaly detected",
          line: anomaly.line,
          function: anomaly.function,
        }));
      }
      return [];
    } catch (error) {
      logger.error("Error detecting anomalies:", error);
      throw new Error(
        `Anomaly detection failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  dispose() {
    // No specific cleanup needed for HTTP-based detector
  }
}

export class AnalysisService {
  private aiDetectorUrl: string;

  constructor() {
    this.aiDetectorUrl =
      process.env.AI_DETECTOR_URL || "http://ai-detector:5002/api/analyze";
  }

  private async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.aiDetectorUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200 && response.data?.status === "healthy";
    } catch (error) {
      logger.error("AI Detector service health check failed:", error);
      return false;
    }
  }

  /**
   * Start a new analysis job
   */
  public async startAnalysis(
    contractId: string,
    options: AnalysisOptions
  ): Promise<string> {
    try {
      // Get contract from database first
      const contract = await Contract.findById(contractId);

      if (!contract) {
        throw new ApiError(404, `Contract ${contractId} not found`);
      }

      // Check service health if anomaly detection is requested
      if (options.anomalyDetection) {
        const isHealthy = await this.checkServiceHealth();
        if (!isHealthy) {
          logger.warn(
            "AI Detector service is not available. Analysis will proceed without anomaly detection."
          );
          options.anomalyDetection = false;
        }
      }

      // Create a new analysis record with proper typing
      const analysis = new Analysis({
        contractId: new Types.ObjectId(contractId),
        status: "queued" as AnalysisStatus,
        startedAt: new Date(),
        vulnerabilities: [] as SecurityVulnerability[],
        gasIssues: [] as GasIssue[],
        complianceResults: {} as Record<string, ComplianceResult>,
        recommendations: [] as string[],
      }) as IAnalysis & { _id: Types.ObjectId }; // Add explicit typing here

      await analysis.save();

      // Add job to the queue
      await analysisQueue.add("process-analysis", {
        contractId,
        analysisId: analysis._id.toString(),
        sourceCode: contract.sourceCode,
        options,
      });

      // Return the analysis ID as string
      return analysis._id.toString();
    } catch (error) {
      logger.error(
        `Error starting analysis for contract ${contractId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process the analysis with memory leak prevention and resource cleanup
   */
  public async processAnalysis(
    sourceCode: string,
    analysisId: string,
    options: AnalysisOptions
  ): Promise<void> {
    logger.info(`Starting analysis ${analysisId} with options:`, options);

    const vulnerabilities = [];
    const gasIssues = [];
    // Define interface for recommendation items
    interface Recommendation {
      type: string;
      description: string;
      impact: string;
      line?: number;
      suggestion: string;
      function?: string;
    }

    const recommendations: Recommendation[] = [];
    const complianceResults = [];
    let overallRiskRating = "low";

    const resources: DisposableResource[] = [];

    try {
      // Run security scanner if enabled
      if (options.securityScan) {
        const securityScanner = new SecurityScanner(sourceCode);
        resources.push(securityScanner);

        const securityResults = securityScanner.scan();
        vulnerabilities.push(...securityResults);

        // Adjust risk rating based on findings
        if (securityResults.some((v) => v.severity === "critical")) {
          overallRiskRating = "critical";
        } else if (
          overallRiskRating !== "critical" &&
          securityResults.some((v) => v.severity === "high")
        ) {
          overallRiskRating = "high";
        } else if (
          overallRiskRating !== "critical" &&
          overallRiskRating !== "high" &&
          securityResults.some((v) => v.severity === "medium")
        ) {
          overallRiskRating = "medium";
        }
      }

      // Run gas optimization if enabled
      if (options.gasOptimization) {
        const gasOptimizer = new GasOptimizer(sourceCode);
        resources.push(gasOptimizer);

        const optimizationResults = gasOptimizer.analyze();
        gasIssues.push(...optimizationResults);

        // Add gas optimization recommendations
        optimizationResults.forEach((issue) => {
          recommendations.push({
            type: "gas",
            description: `Optimize gas usage at line ${issue.location?.line}: ${issue.description}`,
            impact: "medium",
            line: issue.location?.line,
            suggestion: issue.recommendation,
          });
        });
      }

      // Run compliance checks if enabled
      if (options.complianceCheck) {
        const standards = options.standards || ["ERC20", "ERC721"];
        const complianceChecker = new ComplianceChecker(sourceCode, standards);
        resources.push(complianceChecker);

        const checkResults = complianceChecker.checkCompliance();
        complianceResults.push(...checkResults);

        // Add compliance recommendations
        checkResults
          .filter((result) => !result.compliant)
          .forEach((issue) => {
            recommendations.push({
              type: "compliance",
              description: `Non-compliant with ${issue.standard}: ${issue.details}`,
              impact: "medium",
              suggestion: issue.recommendation,
            });
          });
      }

      // Run anomaly detection if enabled
      if (options.anomalyDetection) {
        const anomalyDetector = new AnomalyDetector(sourceCode);
        resources.push(anomalyDetector);

        const anomalies = await anomalyDetector.detectAnomalies();

        // Add any detected anomalies to vulnerabilities
        anomalies.forEach((anomaly) => {
          vulnerabilities.push({
            type: "anomaly",
            severity: anomaly.confidence > 0.8 ? "high" : "medium",
            description: `Potential anomaly detected: ${anomaly.description}`,
            line: anomaly.line,
            function: anomaly.function,
          });

          // Update risk rating based on anomaly confidence
          if (anomaly.confidence > 0.9 && overallRiskRating !== "critical") {
            overallRiskRating = "high";
          }
        });
      }

      // Update analysis with results
      await Analysis.findByIdAndUpdate(analysisId, {
        vulnerabilities,
        gasIssues,
        complianceResults,
        recommendations,
        overallRiskRating,
        status: "completed",
        completedAt: new Date(),
      });

      logger.info(`Analysis ${analysisId} completed successfully`);
    } catch (error) {
      logger.error(`Error processing analysis ${analysisId}:`, error);

      // Update analysis with error
      await Analysis.findByIdAndUpdate(analysisId, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      });

      throw new ApiError(
        500,
        `Analysis processing failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      // Clean up all resources regardless of success or failure
      for (const resource of resources) {
        try {
          // Try each possible cleanup method
          if (typeof resource.dispose === "function") {
            resource.dispose();
          } else if (typeof resource.cleanup === "function") {
            resource.cleanup();
          } else if (typeof resource.close === "function") {
            resource.close();
          }
        } catch (cleanupError) {
          // Log but don't throw cleanup errors
          logger.warn(
            `Error cleaning up resource during analysis:`,
            cleanupError
          );
        }
      }
    }
  }

  /**
   * Get analysis results by contract ID
   */
  public async getAnalysisResults(
    contractId: string
  ): Promise<IAnalysis | null> {
    try {
      return await Analysis.findOne({ contractId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(
        `Error getting analysis results for contract ${contractId}:`,
        error
      );
      throw new ApiError(
        500,
        `Failed to retrieve analysis results: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Calculate overall risk rating based on vulnerabilities
   */
  private calculateOverallRiskRating(
    vulnerabilities: SecurityVulnerability[]
  ): RiskRating {
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

    // Determine overall rating
    if (counts.Critical > 0) {
      return "Critical";
    } else if (counts.High > 0) {
      return "High";
    } else if (counts.Medium > 0) {
      return "Medium";
    } else if (counts.Low > 0) {
      return "Low";
    } else {
      return "Informational";
    }
  }

  /**
   * Get analysis status
   */
  public async getAnalysisStatus(
    analysisId: string
  ): Promise<AnalysisStatus | null> {
    try {
      const analysis = await Analysis.findById(analysisId);
      return analysis ? analysis.status : null;
    } catch (error) {
      logger.error(`Error getting analysis status for ${analysisId}:`, error);
      throw error;
    }
  }
}
