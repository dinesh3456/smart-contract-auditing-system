// src/controllers/report.controller.ts
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { ContractService } from "../services/contract.service";
import { AnalysisService } from "../services/analysis.service";
import { ReportService } from "../services/report.service";
import { logger } from "../utils/logger";
import { ReportFormat } from "../models/report.model"; // Import ReportFormat type
import { Report } from "../models/report.model"; // Import Report model

// Add AuthenticatedRequest type
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

export class ReportController {
  private contractService: ContractService;
  private analysisService: AnalysisService;
  private reportService: ReportService;

  constructor() {
    this.contractService = new ContractService();
    this.analysisService = new AnalysisService();
    this.reportService = new ReportService();
  }

  /**
   * Get report by contract ID
   */
  public getReportByContractId = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.contractId;
      const userId = req.user.id;

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Get analysis results
      const analysis = await this.analysisService.getAnalysisResults(
        contractId
      );

      if (!analysis || analysis.status !== "completed") {
        res.status(404).json({
          success: false,
          message: "Analysis results not found or not completed",
        });
        return;
      }

      // Get report metadata
      const report = await this.reportService.getReportMetadata(contractId);

      if (!report) {
        res.status(404).json({ success: false, message: "Report not found" });
        return;
      }

      res.status(200).json({
        success: true,
        report: {
          id: report._id,
          contractId: report.contractId,
          formats: report.availableFormats,
          generatedAt: report.createdAt,
          summary: report.summary,
        },
      });
    } catch (error) {
      logger.error("Error fetching report:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch report" });
    }
  };

  /**
   * Download report in specified format
   */
  public downloadReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.contractId;
      const format = req.params.format.toLowerCase();
      const userId = req.user.id;

      // Debug info
      logger.info(
        `Download request: contract=${contractId}, format=${format}, user=${userId}`
      );

      // Validate format
      const validFormats = ["pdf", "html", "markdown", "json"];
      if (!validFormats.includes(format)) {
        logger.warn(`Invalid format requested: ${format}`);
        res
          .status(400)
          .json({ success: false, message: "Invalid report format" });
        return;
      }

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        logger.warn(
          `Contract not found or user doesn't have access: ${contractId}`
        );
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Get report metadata to verify status
      const report = await this.reportService.getReportMetadata(contractId);

      if (!report) {
        logger.warn(`No report found for contract: ${contractId}`);
        res.status(404).json({ success: false, message: "Report not found" });
        return;
      }

      // Check report status
      if (report.status !== "completed") {
        logger.warn(`Report not ready, status: ${report.status}`);
        res.status(400).json({
          success: false,
          message: `Report generation is in progress: ${report.status}. Please try again later.`,
        });
        return;
      }

      // Get report file path
      const reportPath = await this.reportService.getReportFilePath(
        contractId,
        format as ReportFormat
      );

      logger.info(`Report path for ${contractId}/${format}: ${reportPath}`);

      if (!reportPath) {
        logger.warn(`No file path found for format: ${format}`);
        res.status(404).json({
          success: false,
          message: `Report in ${format} format not found`,
        });
        return;
      }

      if (!fs.existsSync(reportPath)) {
        logger.warn(`Report file does not exist at path: ${reportPath}`);
        res.status(404).json({
          success: false,
          message: `Report file in ${format} format not found on disk`,
        });
        return;
      }

      // Set content type based on format
      const contentTypes = {
        pdf: "application/pdf",
        html: "text/html",
        markdown: "text/markdown",
        json: "application/json",
      };

      const filename = `${contract.name}-security-audit.${
        format === "markdown" ? "md" : format
      }`;

      // Send file
      logger.info(`Sending file: ${reportPath} as ${filename}`);
      res.setHeader(
        "Content-Type",
        contentTypes[format as keyof typeof contentTypes]
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      const fileStream = fs.createReadStream(reportPath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error("Error downloading report:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to download report" });
    }
  };

  public getReportStatus = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.contractId;
      const userId = req.user.id;

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Get report metadata
      const report = await this.reportService.getReportMetadata(contractId);

      if (!report) {
        res.status(404).json({ success: false, message: "Report not found" });
        return;
      }

      // Return detailed status
      res.status(200).json({
        success: true,
        report: {
          id: report._id,
          contractId: report.contractId,
          status: report.status,
          formats: report.availableFormats,
          generatedAt: report.createdAt,
          error: report.error || null,
        },
      });
    } catch (error) {
      logger.error("Error fetching report status:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch report status" });
    }
  };

  /**
   * Regenerate a report
   */
  public regenerateReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.contractId;
      const userId = req.user.id;
      const { formats } = req.body;

      // Validate formats
      if (!Array.isArray(formats) || formats.length === 0) {
        res.status(400).json({
          success: false,
          message: "At least one report format must be specified",
        });
        return;
      }

      const validFormats = ["pdf", "html", "markdown", "json"];
      const invalidFormats = formats.filter(
        (format) => !validFormats.includes(format)
      );
      if (invalidFormats.length > 0) {
        res.status(400).json({
          success: false,
          message: `Invalid report formats: ${invalidFormats.join(", ")}`,
        });
        return;
      }

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Get analysis results
      const analysis = await this.analysisService.getAnalysisResults(
        contractId
      );

      if (!analysis || analysis.status !== "completed") {
        res.status(404).json({
          success: false,
          message: "Analysis results not found or not completed",
        });
        return;
      }

      // Force clean any existing report for this contract
      await this.cleanReportForContract(contractId);

      // Generate a new report
      const reportJob = await this.reportService.generateReport(
        contractId,
        formats as ReportFormat[],
        {
          contractName: contract.name,
          contractAddress: contract.address,
          contractVersion: contract.version,
          auditDate: new Date().toISOString().split("T")[0],
          auditor: "Smart Contract Audit System", // Add the missing auditor field
          contractContent: contract.sourceCode,
          vulnerabilities: analysis.vulnerabilities,
          gasIssues: analysis.gasIssues,
          complianceResults: analysis.complianceResults,
          anomalyResults: analysis.anomalyResults
            ? {
                ...analysis.anomalyResults,
                anomalyFactors: analysis.anomalyResults.anomalyFactors || [],
              }
            : undefined,
          overallRiskRating: analysis.overallRiskRating,
          recommendations: analysis.recommendations,
          executiveSummary: analysis.executiveSummary || undefined,
        }
      );

      res.status(202).json({
        success: true,
        message: "Report regeneration started",
        reportJobId: reportJob.id,
        contractId,
        formats,
      });
    } catch (error) {
      logger.error("Error regenerating report:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to regenerate report" });
    }
  };

  /**
   * Clean any existing reports for a contract
   */
  public async cleanReportForContract(contractId: string): Promise<void> {
    try {
      // Find all reports for this contract
      const reports = await Report.find({ contractId });

      // Delete all report files
      for (const report of reports) {
        if (report.filePaths) {
          for (const [format, filePath] of Object.entries(report.filePaths)) {
            try {
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.info(`Deleted report file: ${filePath}`);
              }
            } catch (e) {
              logger.error(`Error deleting report file ${filePath}:`, e);
            }
          }
        }
      }

      // Delete the report records
      await Report.deleteMany({ contractId });
      logger.info(`Cleaned all reports for contract ${contractId}`);
    } catch (error) {
      logger.error(`Error cleaning reports for contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a new report
   */
  public generateReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.contractId;
      const userId = req.user.id;
      const formats = req.body.formats || ["pdf"];

      // Validate formats
      const validFormats = ["pdf", "html", "markdown", "json"];
      const invalidFormats: string[] = formats.filter(
        (format: string) => !validFormats.includes(format)
      );

      if (invalidFormats.length > 0) {
        res.status(400).json({
          success: false,
          message: "Invalid report formats",
          invalidFormats,
        });
        return;
      }

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Get analysis results
      const analysis = await this.analysisService.getAnalysisResults(
        contractId
      );

      if (!analysis || analysis.status !== "completed") {
        res.status(404).json({
          success: false,
          message: "Analysis results not found or not completed",
        });
        return;
      }

      // Generate report
      const reportJob = await this.reportService.generateReport(
        contractId,
        formats as ReportFormat[],
        {
          contractName: contract.name,
          contractAddress: contract.address,
          contractVersion: contract.version || "1.0.0", // Provide default if not available
          auditDate: new Date().toISOString().split("T")[0],
          auditor: "Smart Contract Audit System", // Add the missing auditor field
          contractContent: contract.sourceCode,
          vulnerabilities: analysis.vulnerabilities,
          gasIssues: analysis.gasIssues,
          complianceResults: analysis.complianceResults,
          anomalyResults: analysis.anomalyResults,
          executiveSummary: analysis.executiveSummary || undefined,
          overallRiskRating: analysis.overallRiskRating,
          recommendations: analysis.recommendations,
        }
      );

      res.status(202).json({
        success: true,
        message: "Report generation started",
        reportJobId: reportJob.id,
        contractId,
        formats,
      });
    } catch (error) {
      logger.error("Error generating report:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to generate report" });
    }
  };
}
