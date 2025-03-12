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

interface AnomalyResults {
  isAnomaly: boolean;
  anomalyScore: number;
  anomalyDescription: string;
  anomalyFactors: string[];
  recommendations: string[];
}

interface AnalysisOptions {
  securityScan: boolean;
  gasOptimization: boolean;
  complianceCheck: boolean;
  anomalyDetection: boolean;
  standards: string[];
}

// Define a basic security scanner class for local use
class SecurityScanner {
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
}

class GasOptimizer {
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
}

// Define a basic compliance checker class for local use
class StandardComplianceChecker {
  private sourceCode: string;

  constructor(sourceCode: string) {
    this.sourceCode = sourceCode;
  }

  checkERC20(): ComplianceResult {
    const {
      ERC20Checker,
    } = require("../../compliance-checker/src/standards/ERC20Checker");
    const checker = new ERC20Checker(this.sourceCode);
    return checker.checkCompliance();
  }

  checkERC721(): ComplianceResult {
    const {
      ERC721Checker,
    } = require("../../compliance-checker/src/standards/ERC721Checker");
    const checker = new ERC721Checker(this.sourceCode);
    return checker.checkCompliance();
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
  // Modify the startAnalysis method in analysis.service.ts
  // Update the startAnalysis method

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
   * Process the analysis (this would typically be handled by a job queue in production)
   */
  public async processAnalysis(
    sourceCode: string,
    analysisId: string,
    options: AnalysisOptions
  ): Promise<void> {
    try {
      logger.info(`Processing analysis ${analysisId}`);

      // Results containers
      const vulnerabilities: SecurityVulnerability[] = [];
      const gasIssues: GasIssue[] = [];
      const complianceResults: Record<string, ComplianceResult> = {};
      let anomalyResults: AnomalyResults | null = null;
      const recommendations: string[] = [];

      // Run security scanner
      if (options.securityScan) {
        logger.info(`Running security scan for analysis ${analysisId}`);
        const securityScanner = new SecurityScanner(sourceCode);
        vulnerabilities.push(...securityScanner.scan());
      }

      // Run gas optimization
      if (options.gasOptimization) {
        logger.info(`Running gas optimization for analysis ${analysisId}`);
        const gasOptimizer = new GasOptimizer(sourceCode);
        gasIssues.push(...gasOptimizer.analyze());
      }

      // Run compliance check
      if (options.complianceCheck) {
        logger.info(`Running compliance check for analysis ${analysisId}`);
        const complianceChecker = new StandardComplianceChecker(sourceCode);

        for (const standard of options.standards) {
          if (standard === "erc20") {
            complianceResults["erc20"] = complianceChecker.checkERC20();
          } else if (standard === "erc721") {
            complianceResults["erc721"] = complianceChecker.checkERC721();
          }
        }
      }

      // Run anomaly detection (via API call to Python service)
      if (options.anomalyDetection) {
        logger.info(`Running anomaly detection for analysis ${analysisId}`);
        try {
          const anomalyResponse = await axios.post(
            this.aiDetectorUrl,
            {
              contract_code: sourceCode,
            },
            { timeout: 30000 }
          );

          if (anomalyResponse.data && anomalyResponse.data.status) {
            anomalyResults = {
              isAnomaly: anomalyResponse.data.status.includes("Anomaly"),
              anomalyScore: anomalyResponse.data.anomaly_score || 0,
              anomalyDescription: anomalyResponse.data.analysis_summary || "",
              anomalyFactors: anomalyResponse.data.anomaly_factors || [],
              recommendations: anomalyResponse.data.recommendation
                ? [anomalyResponse.data.recommendation]
                : [],
            };
          } else {
            logger.warn(
              `Anomaly detection returned incomplete data for analysis ${analysisId}`
            );
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            if (error.response) {
              // The server responded with a status code outside the 2xx range
              logger.error(
                `Anomaly detection failed with status: ${error.response.status}`,
                {
                  data: error.response.data,
                  analysisId,
                }
              );
            } else if (error.request) {
              // The request was made but no response was received
              logger.error(
                `Anomaly detection timed out for analysis ${analysisId}`,
                {
                  timeoutMs: 30000,
                }
              );
            } else {
              // Something happened in setting up the request
              logger.error(
                `Error setting up anomaly detection request: ${error.message}`
              );
            }
          } else {
            // Handle non-Axios errors
            logger.error(
              `Unknown error in anomaly detection: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      }

      // Collect recommendations from all sources
      if (vulnerabilities.length > 0) {
        recommendations.push(
          "Fix security vulnerabilities, prioritizing Critical and High severity issues."
        );

        // Add specific recommendations for high severity vulnerabilities
        const criticalAndHighVulns = vulnerabilities.filter(
          (v) => v.severity === "Critical" || v.severity === "High"
        );

        if (criticalAndHighVulns.length > 0) {
          for (const vuln of criticalAndHighVulns.slice(0, 3)) {
            // Limit to 3 top issues
            recommendations.push(`${vuln.name}: ${vuln.recommendation}`);
          }
        }
      }

      if (gasIssues.length > 0) {
        recommendations.push(
          "Implement gas optimizations to reduce deployment and transaction costs."
        );
      }

      // Add compliance-specific recommendations
      for (const [standard, result] of Object.entries(complianceResults)) {
        if (!result.compliant && result.recommendations.length > 0) {
          recommendations.push(
            `${standard.toUpperCase()} compliance: ${result.recommendations[0]}`
          );
        }
      }

      // Add anomaly detection recommendations
      if (anomalyResults && anomalyResults.recommendations) {
        recommendations.push(...anomalyResults.recommendations);
      }

      // Determine overall risk rating
      const riskRating = this.calculateOverallRiskRating(vulnerabilities);

      // Update analysis record
      await Analysis.findByIdAndUpdate(analysisId, {
        status: "completed",
        vulnerabilities,
        gasIssues,
        complianceResults,
        anomalyResults,
        overallRiskRating: riskRating,
        recommendations,
        completedAt: new Date(),
      });

      // Update contract status
      try {
        const analysisObj = await Analysis.findById(analysisId);
        if (!analysisObj) {
          logger.error(
            `Analysis ${analysisId} not found when updating contract`
          );
          return;
        }

        if (!analysisObj.contractId) {
          logger.error(`Analysis ${analysisId} has no associated contract ID`);
          return;
        }

        const contractUpdateResult = await Contract.findByIdAndUpdate(
          analysisObj.contractId.toString(),
          {
            status: "analyzed",
            lastAnalyzed: new Date(),
          }
        );

        if (!contractUpdateResult) {
          logger.warn(
            `Contract ${analysisObj.contractId} not found during update after analysis`
          );
        }
      } catch (updateError) {
        logger.error(
          `Failed to update contract after analysis ${analysisId}:`,
          updateError
        );
      }

      logger.info(`Analysis ${analysisId} completed successfully`);
    } catch (error) {
      logger.error(`Error in analysis process for ${analysisId}:`, error);

      // Update analysis record with error status
      await Analysis.findByIdAndUpdate(analysisId, {
        status: "failed",
        completedAt: new Date(),
      });

      // Also update contract status
      const analysisObj = await Analysis.findById(analysisId);
      if (analysisObj && analysisObj.contractId) {
        await Contract.findByIdAndUpdate(analysisObj.contractId, {
          status: "failed",
        });
      }
    }
  }

  /**
   * Get analysis results
   */
  public async getAnalysisResults(
    contractId: string
  ): Promise<IAnalysis | null> {
    try {
      return await Analysis.findOne({ contractId }).sort({ createdAt: -1 });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      logger.error(
        `Error getting analysis results for contract ${contractId}: ${errorMessage}`
      );

      if (error instanceof Error) {
        throw new ApiError(
          500,
          `Failed to retrieve analysis results: ${error.message}`
        );
      }
      throw new ApiError(
        500,
        "Failed to retrieve analysis results due to an unknown error"
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
