import { Report, IReport, ReportFormat } from "../models/report.model";
import { Analysis } from "../models/analysis.model";
import { Types } from "mongoose";
import { logger } from "../utils/logger";
import path from "path";
import fs from "fs";
import { reportQueue } from "../config/queue.config"; // Add the missing import

// Create our own AuditReportGenerator since the import isn't working
class AuditReportGenerator {
  async generatePDFReport(data: ReportData, outputPath: string): Promise<void> {
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(outputPath);

    doc.pipe(writeStream);

    // Header and title
    doc.fontSize(25).text(`Smart Contract Audit Report`, { align: "center" });
    doc.fontSize(20).text(data.contractName, { align: "center" });
    doc.moveDown();
    doc
      .fontSize(12)
      .text(`Contract Address: ${data.contractAddress || "N/A"}`, {
        align: "center",
      });
    doc.fontSize(12).text(`Audit Date: ${data.auditDate}`, { align: "center" });
    doc.moveDown(1);

    // Executive summary
    doc.fontSize(16).text("Executive Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Overall Risk Rating: ${data.overallRiskRating}`);
    doc.text(
      `This audit identified ${data.vulnerabilities.length} vulnerabilities and ${data.gasIssues.length} gas optimization opportunities.`
    );
    doc.moveDown(1);

    // Vulnerabilities section
    doc.fontSize(16).text("Vulnerabilities", { underline: true });
    doc.moveDown(0.5);

    if (data.vulnerabilities.length > 0) {
      data.vulnerabilities.forEach((vuln) => {
        doc.fontSize(14).text(`${vuln.name} (${vuln.severity})`);
        doc
          .fontSize(12)
          .text(
            `Location: Line ${vuln.location.line}${
              vuln.location.file ? ` in ${vuln.location.file}` : ""
            }`
          );
        doc.fontSize(12).text(`Description: ${vuln.details}`);
        doc.fontSize(12).text(`Recommendation: ${vuln.recommendation}`);
        doc.moveDown();
      });
    } else {
      doc.fontSize(12).text("No vulnerabilities detected.");
    }
    doc.moveDown(1);

    // Gas Optimization section
    doc.fontSize(16).text("Gas Optimization", { underline: true });
    doc.moveDown(0.5);

    if (data.gasIssues.length > 0) {
      data.gasIssues.forEach((issue) => {
        doc.fontSize(14).text(issue.description);
        doc
          .fontSize(12)
          .text(
            `Location: Line ${issue.location.line}${
              issue.location.file ? ` in ${issue.location.file}` : ""
            }`
          );
        doc.fontSize(12).text(`Gas Saved: ${issue.gasSaved}`);
        doc.fontSize(12).text(`Recommendation: ${issue.recommendation}`);
        doc.moveDown();
      });
    } else {
      doc.fontSize(12).text("No gas optimization issues detected.");
    }
    doc.moveDown(1);

    // Compliance Results section
    doc.fontSize(16).text("Compliance Results", { underline: true });
    doc.moveDown(0.5);

    if (Object.keys(data.complianceResults).length > 0) {
      Object.entries(data.complianceResults).forEach(([standard, result]) => {
        doc.fontSize(14).text(standard.toUpperCase());
        doc
          .fontSize(12)
          .text(`Status: ${result.compliant ? "Compliant" : "Non-compliant"}`);
        if (
          result.missingRequirements &&
          result.missingRequirements.length > 0
        ) {
          doc.text(
            `Missing Requirements: ${result.missingRequirements.join(", ")}`
          );
        }
        doc.text(
          `Recommendations: ${result.recommendations.join(", ") || "None"}`
        );
        doc.moveDown();
      });
    } else {
      doc.fontSize(12).text("No compliance checks performed.");
    }
    doc.moveDown(1);

    // Anomaly Detection section
    if (data.anomalyResults) {
      doc.fontSize(16).text("Anomaly Detection", { underline: true });
      doc.moveDown(0.5);
      doc
        .fontSize(12)
        .text(
          `Status: ${
            data.anomalyResults.isAnomaly
              ? "Anomaly Detected"
              : "No Anomalies Detected"
          }`
        );
      doc
        .fontSize(12)
        .text(`Anomaly Score: ${data.anomalyResults.anomalyScore.toFixed(2)}`);
      doc
        .fontSize(12)
        .text(`Description: ${data.anomalyResults.anomalyDescription}`);

      if (data.anomalyResults.anomalyFactors.length > 0) {
        doc.fontSize(14).text("Anomaly Factors:");
        data.anomalyResults.anomalyFactors.forEach((factor) => {
          doc.fontSize(12).text(`• ${factor}`);
        });
      }
      doc.moveDown(1);
    }

    // Recommendations section
    doc.fontSize(16).text("Recommendations", { underline: true });
    doc.moveDown(0.5);
    data.recommendations.forEach((rec) => {
      doc.fontSize(12).text(`• ${rec}`);
    });
    doc.moveDown(1);

    // Add contract source code
    doc.fontSize(16).text("Contract Source", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(data.contractContent);

    doc.end();

    return new Promise((resolve, reject) => {
      writeStream.on("finish", () => {
        logger.info(`PDF report generated at ${outputPath}`);
        resolve();
      });
      writeStream.on("error", reject);
    });
  }

  async generateHTMLReport(
    data: ReportData,
    outputPath: string
  ): Promise<void> {
    // Generate HTML content
    const html = `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Contract Audit Report - ${data.contractName}</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 900px; margin: 0 auto; padding: 20px; }
      h1, h2, h3 { color: #333; }
      .header { text-align: center; margin-bottom: 30px; }
      .summary { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      .critical { color: #d32f2f; }
      .high { color: #f57c00; }
      .medium { color: #fbc02d; }
      .low { color: #388e3c; }
      .informational { color: #1976d2; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { padding: 10px; border: 1px solid #ddd; }
      th { background-color: #f2f2f2; }
      .section { margin-bottom: 30px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Smart Contract Audit Report</h1>
      <h2>${data.contractName}</h2>
      <p>Contract Address: ${data.contractAddress || "N/A"}</p>
      <p>Audit Date: ${data.auditDate}</p>
    </div>
  
    <div class="summary">
      <h2>Executive Summary</h2>
      <p><strong>Overall Risk Rating: </strong><span class="${data.overallRiskRating.toLowerCase()}">${
      data.overallRiskRating
    }</span></p>
      <p>This audit identified ${
        data.vulnerabilities.length
      } vulnerabilities and ${
      data.gasIssues.length
    } gas optimization opportunities.</p>
    </div>
  
    <div class="section">
      <h2>Vulnerabilities</h2>
      ${
        data.vulnerabilities.length > 0
          ? `
      <table>
        <tr>
          <th>Name</th>
          <th>Severity</th>
          <th>Location</th>
          <th>Recommendation</th>
        </tr>
        ${data.vulnerabilities
          .map(
            (vuln) => `
        <tr>
          <td>${vuln.name}</td>
          <td class="${vuln.severity.toLowerCase()}">${vuln.severity}</td>
          <td>Line ${vuln.location.line}${
              vuln.location.file ? ` in ${vuln.location.file}` : ""
            }</td>
          <td>${vuln.recommendation}</td>
        </tr>
        `
          )
          .join("")}
      </table>
      `
          : "<p>No vulnerabilities detected.</p>"
      }
    </div>
  
    <div class="section">
      <h2>Gas Optimization</h2>
      ${
        data.gasIssues.length > 0
          ? `
      <table>
        <tr>
          <th>Description</th>
          <th>Location</th>
          <th>Gas Saved</th>
          <th>Recommendation</th>
        </tr>
        ${data.gasIssues
          .map(
            (issue) => `
        <tr>
          <td>${issue.description}</td>
          <td>Line ${issue.location.line}${
              issue.location.file ? ` in ${issue.location.file}` : ""
            }</td>
          <td>${issue.gasSaved}</td>
          <td>${issue.recommendation}</td>
        </tr>
        `
          )
          .join("")}
      </table>
      `
          : "<p>No gas optimization issues detected.</p>"
      }
    </div>
  
    <div class="section">
      <h2>Compliance Results</h2>
      ${
        Object.keys(data.complianceResults).length > 0
          ? `
      <table>
        <tr>
          <th>Standard</th>
          <th>Status</th>
          <th>Recommendations</th>
        </tr>
        ${Object.entries(data.complianceResults)
          .map(
            ([standard, result]) => `
        <tr>
          <td>${standard.toUpperCase()}</td>
          <td>${result.compliant ? "Compliant" : "Non-compliant"}</td>
          <td>${result.recommendations.join(", ") || "None"}</td>
        </tr>
        `
          )
          .join("")}
      </table>
      `
          : "<p>No compliance checks performed.</p>"
      }
    </div>
  
    ${
      data.anomalyResults
        ? `
    <div class="section">
      <h2>Anomaly Detection</h2>
      <p><strong>Status: </strong>${
        data.anomalyResults.isAnomaly
          ? "Anomaly Detected"
          : "No Anomalies Detected"
      }</p>
      <p><strong>Anomaly Score: </strong>${data.anomalyResults.anomalyScore.toFixed(
        2
      )}</p>
      <p><strong>Description: </strong>${
        data.anomalyResults.anomalyDescription
      }</p>
      ${
        data.anomalyResults.anomalyFactors.length > 0
          ? `
      <p><strong>Anomaly Factors:</strong></p>
      <ul>
        ${data.anomalyResults.anomalyFactors
          .map((factor) => `<li>${factor}</li>`)
          .join("")}
      </ul>
      `
          : ""
      }
    </div>
    `
        : ""
    }
  
    <div class="section">
      <h2>Recommendations</h2>
      <ul>
        ${data.recommendations.map((rec) => `<li>${rec}</li>`).join("")}
      </ul>
    </div>
  </body>
  </html>`;

    fs.writeFileSync(outputPath, html);
    logger.info(`HTML report generated at ${outputPath}`);
  }

  async generateMarkdownReport(
    data: ReportData,
    outputPath: string
  ): Promise<void> {
    // Generate Markdown content
    const markdown = `# Smart Contract Audit Report: ${data.contractName}
  
  **Contract Address:** ${data.contractAddress || "N/A"}  
  **Audit Date:** ${data.auditDate}  
  **Overall Risk Rating:** ${data.overallRiskRating}
  
  ## Executive Summary
  
  This audit identified ${data.vulnerabilities.length} vulnerabilities and ${
      data.gasIssues.length
    } gas optimization opportunities.
  
  ## Vulnerabilities
  
  ${
    data.vulnerabilities.length > 0
      ? data.vulnerabilities
          .map(
            (vuln) => `
  ### ${vuln.name} (${vuln.severity})
  
  - **Location:** Line ${vuln.location.line}${
              vuln.location.file ? ` in ${vuln.location.file}` : ""
            }
  - **Description:** ${vuln.details}
  - **Recommendation:** ${vuln.recommendation}
  `
          )
          .join("")
      : "No vulnerabilities detected."
  }
  
  ## Gas Optimization Issues
  
  ${
    data.gasIssues.length > 0
      ? data.gasIssues
          .map(
            (issue) => `
  ### ${issue.description}
  
  - **Location:** Line ${issue.location.line}${
              issue.location.file ? ` in ${issue.location.file}` : ""
            }
  - **Gas Saved:** ${issue.gasSaved}
  - **Recommendation:** ${issue.recommendation}
  `
          )
          .join("")
      : "No gas optimization issues detected."
  }
  
  ## Compliance Results
  
  ${
    Object.keys(data.complianceResults).length > 0
      ? Object.entries(data.complianceResults)
          .map(
            ([standard, result]) => `
  ### ${standard.toUpperCase()}
  
  - **Status:** ${result.compliant ? "Compliant" : "Non-compliant"}
  ${
    result.missingRequirements && result.missingRequirements.length > 0
      ? `- **Missing Requirements:** ${result.missingRequirements.join(", ")}`
      : ""
  }
  - **Recommendations:** ${result.recommendations.join(", ") || "None"}
  `
          )
          .join("")
      : "No compliance checks performed."
  }
  
  ${
    data.anomalyResults
      ? `
  ## Anomaly Detection
  
  - **Status:** ${
    data.anomalyResults.isAnomaly ? "Anomaly Detected" : "No Anomalies Detected"
  }
  - **Anomaly Score:** ${data.anomalyResults.anomalyScore.toFixed(2)}
  - **Description:** ${data.anomalyResults.anomalyDescription}
  
  ${
    data.anomalyResults.anomalyFactors.length > 0
      ? `
  ### Anomaly Factors:
  ${data.anomalyResults.anomalyFactors
    .map((factor) => `- ${factor}`)
    .join("\n")}
  `
      : ""
  }
  `
      : ""
  }
  
  ## Recommendations
  
  ${data.recommendations.map((rec) => `- ${rec}`).join("\n")}
  
  ## Contract Source
  
  \`\`\`solidity
  ${data.contractContent}
  \`\`\`
  `;

    fs.writeFileSync(outputPath, markdown);
    logger.info(`Markdown report generated at ${outputPath}`);
  }

  async generateJSONReport(
    data: ReportData,
    outputPath: string
  ): Promise<void> {
    // Clean up and structure the data for a clean JSON report
    const reportData = {
      meta: {
        contractName: data.contractName,
        contractAddress: data.contractAddress || "N/A",
        contractVersion: data.contractVersion || "N/A",
        auditDate: data.auditDate,
        overallRiskRating: data.overallRiskRating,
      },
      findings: {
        vulnerabilities: data.vulnerabilities.map((v) => ({
          id: v.id,
          name: v.name,
          severity: v.severity,
          location: v.location,
          description: v.details,
          recommendation: v.recommendation,
        })),
        gasIssues: data.gasIssues.map((g) => ({
          id: g.id,
          description: g.description,
          location: g.location,
          gasSaved: g.gasSaved,
          recommendation: g.recommendation,
        })),
        complianceResults: data.complianceResults,
        anomalyResults: data.anomalyResults,
      },
      recommendations: data.recommendations,
    };

    // Pretty-print the JSON with 2-space indentation
    fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
    logger.info(`JSON report generated at ${outputPath}`);
  }
}

interface ReportData {
  contractName: string;
  contractAddress?: string;
  contractVersion?: string;
  auditDate: string;
  contractContent: string;
  vulnerabilities: {
    id: string;
    name: string;
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
    location: {
      line: number;
      column?: number;
      file?: string;
    };
    details: string;
    recommendation: string;
  }[];
  gasIssues: {
    id: string;
    description: string;
    location: {
      line: number;
      column?: number;
      file?: string;
    };
    gasSaved: string;
    recommendation: string;
  }[];
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

interface ReportJob {
  id: string;
  contractId: string;
  formats: ReportFormat[];
}

export class ReportService {
  private reportGenerator: AuditReportGenerator;
  private reportsDir: string;

  constructor() {
    this.reportGenerator = new AuditReportGenerator();
    this.reportsDir =
      process.env.REPORTS_DIR || path.join(__dirname, "../../reports");

    // Ensure reports directory exists
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  /**
   * Generate a report based on analysis results
   */
  // Update the generateReport method to use queue
  public async generateReport(
    contractId: string,
    formats: ReportFormat[],
    reportData: ReportData
  ): Promise<ReportJob> {
    try {
      // Get analysis results
      const analysis = await Analysis.findOne({ contractId })
        .sort({
          createdAt: -1,
        })
        .lean();

      if (!analysis) {
        throw new Error(`No analysis found for contract ${contractId}`);
      }

      // Create report directory for this contract
      const contractDir = path.join(this.reportsDir, contractId);
      if (!fs.existsSync(contractDir)) {
        fs.mkdirSync(contractDir, { recursive: true });
      }

      const timestamp = Date.now();

      // Create report record first
      const report = new Report({
        contractId,
        analysisId: analysis._id,
        filePaths: {},
        availableFormats: [],
        summary: this.generateSummary(reportData),
      });

      await report.save();

      // Convert _id to string safely
      const reportId = report._id
        ? report._id instanceof Types.ObjectId
          ? report._id.toString()
          : String(report._id)
        : "";

      // Add job to the queue instead of direct processing
      await reportQueue.add("generate-report", {
        contractId,
        analysisId: analysis._id.toString(),
        formats,
        reportData,
        reportId,
        timestamp,
      });

      return {
        id: reportId,
        contractId,
        formats,
      };
    } catch (error) {
      logger.error(
        `Error initiating report generation for contract ${contractId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process the report generation job
   * This method is used by the queue worker
   */
  public async processReportGeneration(
    contractId: string,
    analysisId: string,
    formats: ReportFormat[],
    reportData: ReportData,
    timestamp: number
  ): Promise<void> {
    try {
      const contractDir = path.join(this.reportsDir, contractId);
      const generatedFilePaths: Record<ReportFormat, string> = {} as Record<
        ReportFormat,
        string
      >;
      const availableFormats: ReportFormat[] = [];

      for (const format of formats) {
        try {
          const filename = `report-${timestamp}.${
            format === "markdown" ? "md" : format
          }`;
          const outputPath = path.join(contractDir, filename);

          switch (format) {
            case "pdf":
              await this.reportGenerator.generatePDFReport(
                reportData,
                outputPath
              );
              break;
            case "html":
              await this.reportGenerator.generateHTMLReport(
                reportData,
                outputPath
              );
              break;
            case "markdown":
              await this.reportGenerator.generateMarkdownReport(
                reportData,
                outputPath
              );
              break;
            case "json":
              await this.reportGenerator.generateJSONReport(
                reportData,
                outputPath
              );
              break;
          }

          generatedFilePaths[format] = outputPath;
          availableFormats.push(format);

          logger.info(
            `Generated ${format} report for contract ${contractId} at ${outputPath}`
          );
        } catch (error) {
          logger.error(
            `Error generating ${format} report for contract ${contractId}:`,
            error
          );
          await Report.findOneAndUpdate(
            { contractId, analysisId },
            {
              status: "failed",
              error: error instanceof Error ? error.message : String(error),
            }
          );

          throw error;
        }
      }

      // Update report record with file paths
      await Report.findOneAndUpdate(
        { contractId, analysisId },
        {
          filePaths: generatedFilePaths,
          availableFormats,
        }
      );

      logger.info(
        `Updated report record for contract ${contractId} with ${availableFormats.length} formats`
      );
    } catch (error) {
      logger.error(`Error generating report files for ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Generate a summary of the report
   */
  private generateSummary(reportData: ReportData): string {
    const vulnCounts = {
      Critical: reportData.vulnerabilities.filter(
        (v) => v.severity === "Critical"
      ).length,
      High: reportData.vulnerabilities.filter((v) => v.severity === "High")
        .length,
      Medium: reportData.vulnerabilities.filter((v) => v.severity === "Medium")
        .length,
      Low: reportData.vulnerabilities.filter((v) => v.severity === "Low")
        .length,
      Informational: reportData.vulnerabilities.filter(
        (v) => v.severity === "Informational"
      ).length,
    };

    const gasIssuesCount = reportData.gasIssues.length;

    const complianceStatus = Object.entries(reportData.complianceResults)
      .map(
        ([standard, result]) =>
          `${standard.toUpperCase()}: ${
            result.compliant ? "Compliant" : "Non-compliant"
          }`
      )
      .join(", ");

    let anomalySummary = "Not analyzed";
    if (reportData.anomalyResults) {
      anomalySummary = reportData.anomalyResults.isAnomaly
        ? `Anomalous (Score: ${reportData.anomalyResults.anomalyScore.toFixed(
            2
          )})`
        : "No anomalies detected";
    }

    return (
      `Overall Risk: ${reportData.overallRiskRating}. ` +
      `Vulnerabilities: ${vulnCounts.Critical} Critical, ${vulnCounts.High} High, ${vulnCounts.Medium} Medium. ` +
      `Gas Issues: ${gasIssuesCount}. ` +
      `Compliance: ${complianceStatus}. ` +
      `Anomaly Detection: ${anomalySummary}.`
    );
  }

  /**
   * Get report metadata
   */
  public async getReportMetadata(contractId: string): Promise<IReport | null> {
    try {
      return await Report.findOne({ contractId }).sort({ createdAt: -1 });
    } catch (error) {
      logger.error(`Error getting report metadata for ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Get report file path
   */
  public async getReportFilePath(
    contractId: string,
    format: ReportFormat
  ): Promise<string | null> {
    try {
      const report = await this.getReportMetadata(contractId);

      if (!report || !report.filePaths || !report.filePaths[format]) {
        return null;
      }

      return report.filePaths[format];
    } catch (error) {
      logger.error(`Error getting report file path for ${contractId}:`, error);
      throw error;
    }
  }
}
