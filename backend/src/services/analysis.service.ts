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
export interface DisposableResource {
  [method: string]: any;
}

// Define a basic security scanner class for local use
class SecurityScanner implements DisposableResource {
  private scanner: any;

  constructor(private readonly sourceCode: string) {
    try {
      // Import from the main index.ts file
      const AnalysisEngine = require("analysis-engine");
      this.scanner = new AnalysisEngine.SecurityScanner(
        sourceCode,
        "contract.sol"
      );
    } catch (error) {
      logger.error(
        `Error initializing SecurityScanner: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw new Error(
        `Failed to initialize security scanner: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
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
    try {
      // Import from the main index.ts file
      const AnalysisEngine = require("analysis-engine");
      this.optimizer = new AnalysisEngine.GasOptimizer(
        sourceCode,
        "contract.sol"
      );
    } catch (error) {
      logger.error(
        `Error initializing GasOptimizer: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw new Error(
        `Failed to initialize gas optimizer: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
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
  private results: any = {};

  constructor(sourceCode: string, standards: string[]) {
    this.sourceCode = sourceCode;
    this.standards = standards;
    this.checkStandards();
  }

  private checkStandards() {
    for (const standard of this.standards) {
      try {
        if (standard.toLowerCase() === "erc20") {
          const {
            ERC20Checker,
          } = require("compliance-checker/dist/standards/ERC20Checker");
          const checker = new ERC20Checker(this.sourceCode);
          this.checkers.push(checker);
          this.results["erc20"] = checker.checkCompliance();
        } else if (standard.toLowerCase() === "erc721") {
          const {
            ERC721Checker,
          } = require("compliance-checker/dist/standards/ERC721Checker");
          const checker = new ERC721Checker(this.sourceCode);
          this.checkers.push(checker);
          this.results["erc721"] = checker.checkCompliance();
        }
      } catch (error) {
        logger.error(`Error checking compliance with ${standard}:`, error);
        this.results[standard.toLowerCase()] = {
          standard,
          compliant: false,
          missingRequirements: [
            `Error checking compliance: ${
              error instanceof Error ? error.message : String(error)
            }`,
          ],
          recommendations: [
            "Please check your contract implementation against the standard specification.",
          ],
        };
      }
    }
  }

  checkCompliance(): any[] {
    return Object.values(this.results);
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
    // Get base URL without endpoint
    const baseUrl =
      process.env.AI_DETECTOR_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://ai-detector:5002"
        : "http://localhost:5002");

    // Append the analyze endpoint
    this.aiDetectorUrl = `${baseUrl}/api/analyze`;
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
    // Store only the base URL without endpoint
    this.aiDetectorUrl =
      process.env.AI_DETECTOR_URL ||
      (process.env.NODE_ENV === "production"
        ? "http://ai-detector:5002"
        : "http://localhost:5002");
  }

  private async checkServiceHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.aiDetectorUrl}/health`, {
        timeout: 5000,
      });
      return response.status === 200 && response.data?.status === "healthy";
    } catch (error) {
      // Safely log error without circular references
      if (error instanceof Error) {
        logger.error(
          `AI Detector service health check failed: ${error.message}`
        );
      } else {
        logger.error(
          `AI Detector service health check failed: ${String(error)}`
        );
      }
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

      // Check if contract has source code
      if (!contract.sourceCode) {
        throw new ApiError(400, `Contract ${contractId} has no source code`);
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
        status: "pending" as AnalysisStatus,
        startedAt: new Date(),
        vulnerabilities: [] as SecurityVulnerability[],
        gasIssues: [] as GasIssue[],
        complianceResults: {} as Record<string, ComplianceResult>,
        recommendations: [] as string[],
      }) as IAnalysis & { _id: Types.ObjectId };

      await analysis.save();

      try {
        // Add job to the queue with timeout
        await Promise.race([
          analysisQueue.add("process-analysis", {
            contractId,
            analysisId: analysis._id.toString(),
            sourceCode: contract.sourceCode,
            options,
          }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Queue add operation timed out")),
              15000
            )
          ),
        ]);

        logger.info(`Analysis job added to queue for contract ${contractId}`);
      } catch (queueError) {
        logger.error(`Error adding analysis to queue: ${queueError}`);
        // Update analysis status to reflect queue failure
        await Analysis.findByIdAndUpdate(analysis._id, {
          status: "failed" as AnalysisStatus,
          error: `Queue operation failed: ${
            queueError instanceof Error
              ? queueError.message
              : String(queueError)
          }`,
        });
        await Contract.findByIdAndUpdate(contractId, { status: "uploaded" });

        throw new ApiError(
          500,
          `Failed to queue analysis job: Queue service may be unavailable`
        );
      }

      // Return the analysis ID as string
      return analysis._id.toString();
    } catch (error) {
      // Update contract status in case of any error
      try {
        await Contract.findByIdAndUpdate(contractId, { status: "uploaded" });
      } catch (updateError) {
        logger.error(
          `Error updating contract status after analysis failure: ${updateError}`
        );
      }

      // Re-throw the original error
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
    const recommendations: string[] = []; // Change to string array
    const complianceResults: Record<string, any> = {};
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
          recommendations.push(
            `Optimize gas usage at line ${issue.location?.line}: ${issue.description} - ${issue.recommendation}`
          );
        });
      }

      // Run compliance checks if enabled
      if (options.complianceCheck) {
        const standards = options.standards || ["ERC20", "ERC721"];
        const complianceChecker = new ComplianceChecker(sourceCode, standards);
        resources.push(complianceChecker);

        const checkResults = complianceChecker.checkCompliance();

        // Instead of pushing to an array, add items to the object with string keys
        checkResults.forEach((result) => {
          if (result.standard) {
            complianceResults[result.standard.toLowerCase()] = result;
          }
        });

        // Add compliance recommendations
        Object.values(complianceResults)
          .filter((result) => !result.compliant)
          .forEach((issue) => {
            // Create a more detailed description that includes all important information
            const missingReqs = issue.missingRequirements
              ? `Missing: ${issue.missingRequirements.join(", ")}`
              : "";

            recommendations.push(
              `Non-compliant with ${issue.standard}: ${missingReqs}. ${
                issue.recommendations
                  ? issue.recommendations.join("; ")
                  : "Implement all required functions and events for this standard"
              }`
            );
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
            id: "ANOMALY-" + Math.floor(Math.random() * 1000),
            name: "Anomaly Detection",
            severity: anomaly.confidence > 0.8 ? "high" : "medium",
            description: `Potential anomaly detected: ${anomaly.description}`,
            location: {
              line: anomaly.line || 0,
            },
            details: "AI-detected potential issue",
            recommendation: "Review this section of code carefully",
          });

          // Add recommendations based on anomalies
          recommendations.push(
            `Review potential anomaly: ${anomaly.description}`
          );

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
