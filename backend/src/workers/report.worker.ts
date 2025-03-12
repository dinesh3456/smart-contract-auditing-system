// backend/src/workers/report.worker.ts
import { reportQueue } from "../config/queue.config";
import { ReportService } from "../services/report.service";
import { logger } from "../utils/logger";
import { Report, ReportFormat } from "../models/report.model";

// Define the report data interface
interface ReportData {
  contractName: string;
  contractAddress?: string;
  contractVersion?: string;
  auditDate: string;
  contractContent: string;
  vulnerabilities: Array<{
    id: string;
    name: string;
    description: string;
    severity: string;
    location: {
      line: number;
      column?: number;
      file?: string;
    };
    details: string;
    recommendation: string;
  }>;
  gasIssues: Array<{
    id: string;
    description: string;
    location: {
      line: number;
      column?: number;
      file?: string;
    };
    gasSaved: string;
    recommendation: string;
  }>;
  complianceResults: Record<
    string,
    {
      compliant: boolean;
      missingRequirements?: string[];
      recommendations: string[];
    }
  >;
  anomalyResults?: {
    isAnomaly: boolean;
    anomalyScore: number;
    anomalyDescription: string;
    anomalyFactors: string[];
    recommendations: string[];
  };
  overallRiskRating: string;
  recommendations: string[];
}

interface JobData {
  contractId: string;
  analysisId: string;
  formats: ReportFormat[];
  reportData: ReportData;
  reportId: string;
  timestamp: number;
}

const reportService = new ReportService();

// Process report generation jobs
reportQueue.process("generate-report", async (job) => {
  const { contractId, analysisId, formats, reportData, timestamp } = job.data;

  logger.info(
    `Worker processing report job ${job.id} for contract ${contractId}`
  );

  try {
    await reportService.processReportGeneration(
      contractId,
      analysisId,
      formats,
      reportData,
      timestamp
    );
    return { success: true, contractId };
  } catch (error) {
    logger.error(`Worker error processing report ${contractId}:`, error);
    await Report.findOneAndUpdate(
      { contractId, analysisId },
      {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      }
    );
    throw error; // Let Bull handle the retry
  }
});

logger.info("Report worker started");
