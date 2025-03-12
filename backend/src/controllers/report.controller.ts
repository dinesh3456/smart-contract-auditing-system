// src/controllers/report.controller.ts
import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import { ContractService } from "../services/contract.service";
import { AnalysisService } from "../services/analysis.service";
import { ReportService } from "../services/report.service";
import { logger } from "../utils/logger";
import { ReportFormat } from "../models/report.model"; // Import ReportFormat type

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

      // Validate format
      const validFormats = ["pdf", "html", "markdown", "json"];
      if (!validFormats.includes(format)) {
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
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Get report file path
      const reportPath = await this.reportService.getReportFilePath(
        contractId,
        format as ReportFormat
      );

      if (!reportPath || !fs.existsSync(reportPath)) {
        res.status(404).json({
          success: false,
          message: `Report in ${format} format not found`,
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

      // Generate report (might be async in a real implementation)
      const reportJob = await this.reportService.generateReport(
        contractId,
        formats as ReportFormat[],
        {
          contractName: contract.name,
          contractAddress: contract.address,
          contractVersion: contract.version,
          auditDate: new Date().toISOString().split("T")[0],
          contractContent: contract.sourceCode, // Make sure this matches the ReportData interface
          vulnerabilities: analysis.vulnerabilities,
          gasIssues: analysis.gasIssues,
          complianceResults: analysis.complianceResults,
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
