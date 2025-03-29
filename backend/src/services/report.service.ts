import * as fs from "fs";
import * as path from "path";
import PDFDocument from "pdfkit";
import { logger } from "../utils/logger";
import { Report, IReport, ReportFormat } from "../models/report.model";
import { Analysis } from "../models/analysis.model";
import { Types } from "mongoose";
import { reportQueue } from "../config/queue.config"; // Add the missing import

// Define these types locally instead of importing from other services
interface VulnerabilityFinding {
  id: string;
  name: string;
  description: string;
  severity: string;
  location: {
    line: number;
    file?: string;
  };
  details: string;
  recommendation: string;
}

interface GasIssue {
  id: string;
  description: string;
  location: {
    line: number;
    file?: string;
  };
  gasSaved: string;
  recommendation: string;
}

interface ComplianceResult {
  compliant: boolean;
  missingRequirements: string[];
  recommendations: string[];
}

export interface AuditReportData {
  contractName: string;
  contractAddress?: string;
  contractVersion?: string;
  auditDate: string;
  auditor: string;
  contractContent: string;
  vulnerabilities: VulnerabilityFinding[];
  gasIssues: GasIssue[];
  complianceResults: Record<string, ComplianceResult>;
  anomalyResults?: {
    isAnomaly: boolean;
    anomalyScore: number;
    anomalyDescription: string;
    anomalyFactors?: any[];
    recommendations?: string[];
  };
  executiveSummary?: string;
  overallRiskRating: "Critical" | "High" | "Medium" | "Low" | "Informational";
  recommendations: any[]; // Changed to any[] to handle both strings and objects
}

export class AuditReportGenerator {
  /**
   * Helper function to format recommendation objects into strings
   */
  private formatRecommendation(recommendation: any): string {
    // Handle recommendation objects with specific properties
    if (recommendation && typeof recommendation === "object") {
      if (recommendation.description || recommendation.suggestion) {
        // Extract meaningful data from recommendation object
        const parts = [];

        if (recommendation.type) parts.push(`Type: ${recommendation.type}`);
        if (recommendation.description) parts.push(recommendation.description);
        if (recommendation.impact)
          parts.push(`Impact: ${recommendation.impact}`);
        if (recommendation.suggestion) parts.push(recommendation.suggestion);

        return parts.join(" - ");
      }

      // Fallback - try to stringify the object
      try {
        return JSON.stringify(recommendation);
      } catch (e) {
        return "Complex recommendation (see details in JSON report)";
      }
    }

    // For string recommendations, return as is
    return recommendation.toString();
  }

  /**
   * Generate a comprehensive audit report in PDF format
   */
  public generatePDFReport(
    data: AuditReportData,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });

        // Stream output to file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);

        // Add content to the PDF
        this.addReportHeader(doc, data);
        this.addExecutiveSummary(doc, data);
        this.addVulnerabilities(doc, data);
        this.addGasIssues(doc, data);
        this.addComplianceResults(doc, data);

        if (data.anomalyResults) {
          this.addAnomalyResults(doc, data);
        }

        this.addRecommendations(doc, data);
        this.addContractCode(doc, data);
        this.addDisclaimers(doc);

        // Finalize PDF and close stream
        doc.end();

        stream.on("finish", () => {
          resolve(outputPath);
        });

        stream.on("error", (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate a markdown report
   */
  async generateMarkdownReport(
    data: AuditReportData,
    outputPath: string
  ): Promise<void> {
    // Ensure recommendations are properly formatted as strings
    const formattedRecommendations = data.recommendations.map((rec) => {
      if (typeof rec === "string") {
        return rec;
      }
      // If it's an object with properties, format it properly
      if (typeof rec === "object" && rec !== null) {
        if ("description" in rec) {
          return `${rec.description}${
            rec.suggestion ? " - " + rec.suggestion : ""
          }`;
        }
        return JSON.stringify(rec);
      }
      return String(rec);
    });

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
    
    - **Status:** ${
      (result as ComplianceResult).compliant ? "Compliant" : "Non-compliant"
    }
    ${
      result.missingRequirements && result.missingRequirements.length > 0
        ? `- **Missing Requirements:** ${result.missingRequirements.join(", ")}`
        : ""
    }
    - **Recommendations:** ${
      Array.isArray(result.recommendations)
        ? result.recommendations.join(", ")
        : typeof result.recommendations === "string"
        ? result.recommendations
        : "None"
    }
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
      data.anomalyResults.isAnomaly
        ? "Anomaly Detected"
        : "No Anomalies Detected"
    }
    - **Anomaly Score:** ${data.anomalyResults.anomalyScore.toFixed(2)}
    - **Description:** ${data.anomalyResults.anomalyDescription}
    
    ${
      data.anomalyResults.anomalyFactors &&
      data.anomalyResults.anomalyFactors.length > 0
        ? `
    ### Anomaly Factors:
    ${data.anomalyResults.anomalyFactors
      .map(
        (factor) =>
          `- ${typeof factor === "string" ? factor : JSON.stringify(factor)}`
      )
      .join("\n")}
    `
        : ""
    }
    `
        : ""
    }
    
    ## Recommendations
    
    ${formattedRecommendations.map((rec) => `- ${rec}`).join("\n")}
    
    ## Contract Source
    
    \`\`\`solidity
    ${data.contractContent}
    \`\`\`
    `;

    fs.writeFileSync(outputPath, markdown);
    logger.info(`Markdown report generated at ${outputPath}`);
  }

  /**
   * Generate JSON report
   */
  public generateJSONReport(
    data: AuditReportData,
    outputPath: string
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
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
          // Format the recommendations before adding them to the JSON
          recommendations: data.recommendations.map((rec) => {
            if (rec && typeof rec === "object") {
              // Extract the object values into a structured format
              return {
                type: rec.type || "general",
                description: rec.description || "",
                impact: rec.impact || "",
                suggestion: rec.suggestion || "",
                // Include the original string representation if needed
                text: this.formatRecommendation(rec),
              };
            }
            return rec; // Return string recommendations as-is
          }),
        };

        fs.writeFileSync(outputPath, JSON.stringify(reportData, null, 2));
        resolve(outputPath);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate HTML report
   */
  async generateHTMLReport(
    data: AuditReportData,
    outputPath: string
  ): Promise<void> {
    // Ensure recommendations are properly formatted
    const formattedRecommendations = data.recommendations.map((rec) => {
      if (typeof rec === "string") {
        return rec;
      }
      // If it's an object with properties, format it properly
      if (typeof rec === "object" && rec !== null) {
        if ("description" in rec) {
          return `${rec.description}${
            rec.suggestion ? " - " + rec.suggestion : ""
          }`;
        }
        return JSON.stringify(rec);
      }
      return String(rec);
    });

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
            <td>${
              (result as ComplianceResult).compliant
                ? "Compliant"
                : "Non-compliant"
            }</td>
            <td>${
              Array.isArray((result as ComplianceResult).recommendations)
                ? (result as ComplianceResult).recommendations.join(", ")
                : typeof (result as ComplianceResult).recommendations ===
                  "string"
                ? (result as ComplianceResult).recommendations
                : "None"
            }</td>
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
          data.anomalyResults.anomalyFactors &&
          data.anomalyResults.anomalyFactors.length > 0
            ? `
        <p><strong>Anomaly Factors:</strong></p>
        <ul>
          ${data.anomalyResults.anomalyFactors
            .map(
              (factor) =>
                `<li>${
                  typeof factor === "string" ? factor : JSON.stringify(factor)
                }</li>`
            )
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
          ${formattedRecommendations.map((rec) => `<li>${rec}</li>`).join("")}
        </ul>
      </div>
  
      <div class="section">
        <h2>Contract Source</h2>
        <pre><code>${data.contractContent}</code></pre>
      </div>
    </body>
    </html>`;

    fs.writeFileSync(outputPath, html);
    logger.info(`HTML report generated at ${outputPath}`);
  }
  /* PDF Report Sections */

  /**
   * Add report header to PDF
   */
  private addReportHeader(
    doc: PDFKit.PDFDocument,
    data: AuditReportData
  ): void {
    doc
      .fontSize(25)
      .text("Smart Contract Security Audit Report", { align: "center" });
    doc.moveDown();

    doc
      .fontSize(12)
      .text(`Contract: ${data.contractName}`, { align: "center" });

    if (data.contractAddress) {
      doc
        .fontSize(12)
        .text(`Address: ${data.contractAddress}`, { align: "center" });
    }

    if (data.contractVersion) {
      doc
        .fontSize(12)
        .text(`Version: ${data.contractVersion}`, { align: "center" });
    }

    doc.moveDown();
    doc.fontSize(12).text(`Audit Date: ${data.auditDate}`, { align: "center" });
    doc.fontSize(12).text(`Auditor: ${data.auditor}`, { align: "center" });

    doc.moveDown();
    this.addDivider(doc);
  }

  /**
   * Add executive summary to PDF
   */
  private addExecutiveSummary(
    doc: PDFKit.PDFDocument,
    data: AuditReportData
  ): void {
    doc.fontSize(18).text("Executive Summary", { underline: true });
    doc.moveDown();

    // Add custom summary if provided
    if (data.executiveSummary) {
      doc.fontSize(12).text(data.executiveSummary);
      doc.moveDown();
    }

    // Add overall risk rating
    doc.fontSize(14).text("Overall Risk Rating:");

    const riskColors = {
      Critical: "#7F0000",
      High: "#FF0000",
      Medium: "#FFA500",
      Low: "#FFFF00",
      Informational: "#00FF00",
    };

    doc
      .fontSize(12)
      .fillColor(riskColors[data.overallRiskRating] || "#000000")
      .text(data.overallRiskRating)
      .fillColor("#000000");

    doc.moveDown();

    // Add vulnerability summary
    doc.fontSize(14).text("Vulnerability Summary:");

    const criticalCount = data.vulnerabilities.filter(
      (v) => v.severity === "Critical"
    ).length;
    const highCount = data.vulnerabilities.filter(
      (v) => v.severity === "High"
    ).length;
    const mediumCount = data.vulnerabilities.filter(
      (v) => v.severity === "Medium"
    ).length;
    const lowCount = data.vulnerabilities.filter(
      (v) => v.severity === "Low"
    ).length;
    const infoCount = data.vulnerabilities.filter(
      (v) => v.severity === "Informational"
    ).length;

    doc.fontSize(10);
    doc.list(
      [
        `Critical: ${criticalCount}`,
        `High: ${highCount}`,
        `Medium: ${mediumCount}`,
        `Low: ${lowCount}`,
        `Informational: ${infoCount}`,
      ],
      { bulletRadius: 2, textIndent: 20 }
    );

    // Add compliance summary
    doc.moveDown();
    doc.fontSize(14).text("Compliance Summary:");

    const compliantStandards = Object.entries(data.complianceResults)
      .filter(([_, result]) => result.compliant)
      .map(([standard, _]) => standard.toUpperCase());

    const nonCompliantStandards = Object.entries(data.complianceResults)
      .filter(([_, result]) => !result.compliant)
      .map(([standard, _]) => standard.toUpperCase());

    if (compliantStandards.length > 0) {
      doc.fontSize(10).text(`Compliant with: ${compliantStandards.join(", ")}`);
    }

    if (nonCompliantStandards.length > 0) {
      doc
        .fontSize(10)
        .text(`Non-compliant with: ${nonCompliantStandards.join(", ")}`);
    }

    // Add anomaly detection summary if available
    if (data.anomalyResults) {
      doc.moveDown();
      doc.fontSize(14).text("Anomaly Detection:");

      const anomalyStatus = data.anomalyResults.isAnomaly
        ? "Suspicious patterns detected"
        : "No suspicious patterns detected";

      doc.fontSize(10).text(`Status: ${anomalyStatus}`);
      doc
        .fontSize(10)
        .text(`Anomaly Score: ${data.anomalyResults.anomalyScore.toFixed(2)}`);
    }

    doc.moveDown();
    this.addDivider(doc);
  }

  /**
   * Add vulnerabilities section to PDF
   */
  private addVulnerabilities(
    doc: PDFKit.PDFDocument,
    data: AuditReportData
  ): void {
    doc.fontSize(18).text("Vulnerabilities", { underline: true });
    doc.moveDown();

    if (data.vulnerabilities.length === 0) {
      doc.fontSize(12).text("No vulnerabilities detected.");
      doc.moveDown();
      this.addDivider(doc);
      return;
    }

    // Group vulnerabilities by severity
    const severities: (
      | "Critical"
      | "High"
      | "Medium"
      | "Low"
      | "Informational"
    )[] = ["Critical", "High", "Medium", "Low", "Informational"];

    for (const severity of severities) {
      const vulns = data.vulnerabilities.filter((v) => v.severity === severity);

      if (vulns.length === 0) continue;

      // Define color based on severity
      const severityColors = {
        Critical: "#7F0000",
        High: "#FF0000",
        Medium: "#FFA500",
        Low: "#FFFF00",
        Informational: "#00FF00",
      };

      doc
        .fontSize(16)
        .fillColor(severityColors[severity] || "#000000")
        .text(`${severity} Severity (${vulns.length})`)
        .fillColor("#000000");
      doc.moveDown();

      vulns.forEach((vuln, index) => {
        doc.fontSize(14).text(`${index + 1}. ${vuln.name} (${vuln.id})`);
        doc.fontSize(10).text(`Description: ${vuln.description}`);
        doc.fontSize(10).text(`Impact: ${vuln.details}`);
        doc
          .fontSize(10)
          .text(
            `Location: Line ${vuln.location.line}${
              vuln.location.file ? ` in ${vuln.location.file}` : ""
            }`
          );
        doc.fontSize(10).text(`Recommendation: ${vuln.recommendation}`);
        doc.moveDown();
      });
    }

    this.addDivider(doc);
  }

  /**
   * Add gas issues section to PDF
   */
  private addGasIssues(doc: PDFKit.PDFDocument, data: AuditReportData): void {
    doc.fontSize(18).text("Gas Optimization Issues", { underline: true });
    doc.moveDown();

    if (data.gasIssues.length === 0) {
      doc.fontSize(12).text("No gas optimization issues detected.");
      doc.moveDown();
      this.addDivider(doc);
      return;
    }

    data.gasIssues.forEach((issue, index) => {
      doc.fontSize(14).text(`${index + 1}. ${issue.description}`);
      doc
        .fontSize(10)
        .text(
          `Location: Line ${issue.location.line}${
            issue.location.file ? ` in ${issue.location.file}` : ""
          }`
        );
      doc.fontSize(10).text(`Potential Gas Savings: ${issue.gasSaved}`);
      doc.fontSize(10).text(`Recommendation: ${issue.recommendation}`);
      doc.moveDown();
    });

    this.addDivider(doc);
  }

  /**
   * Add compliance results section to PDF
   */
  private addComplianceResults(
    doc: PDFKit.PDFDocument,
    data: AuditReportData
  ): void {
    doc.fontSize(18).text("Standard Compliance", { underline: true });
    doc.moveDown();

    for (const [standard, result] of Object.entries(data.complianceResults)) {
      const standardUpper = standard.toUpperCase();
      doc.fontSize(16).text(`${standardUpper} Standard`);

      const status = result.compliant ? "Compliant ✓" : "Non-compliant ✗";
      const statusColor = result.compliant ? "#00AA00" : "#AA0000";

      doc
        .fontSize(12)
        .fillColor(statusColor)
        .text(`Status: ${status}`)
        .fillColor("#000000");

      if (!result.compliant && result.missingRequirements.length > 0) {
        doc.fontSize(12).text("Missing Requirements:");
        doc.fontSize(10);
        doc.list(result.missingRequirements, {
          bulletRadius: 2,
          textIndent: 20,
        });
      }

      if (result.recommendations.length > 0) {
        doc.fontSize(12).text("Recommendations:");
        doc.fontSize(10);
        doc.list(result.recommendations, { bulletRadius: 2, textIndent: 20 });
      }

      doc.moveDown();
    }

    this.addDivider(doc);
  }

  /**
   * Add anomaly results section to PDF
   */
  private addAnomalyResults(
    doc: PDFKit.PDFDocument,
    data: AuditReportData
  ): void {
    if (!data.anomalyResults) return;

    doc.fontSize(18).text("Anomaly Detection Results", { underline: true });
    doc.moveDown();

    const anomaly = data.anomalyResults;
    const status = anomaly.isAnomaly ? "Anomalous ⚠" : "Normal ✓";
    const statusColor = anomaly.isAnomaly ? "#AA0000" : "#00AA00";

    doc
      .fontSize(12)
      .fillColor(statusColor)
      .text(`Status: ${status}`)
      .fillColor("#000000");
    doc.fontSize(12).text(`Anomaly Score: ${anomaly.anomalyScore.toFixed(2)}`);
    doc.fontSize(12).text(`Description: ${anomaly.anomalyDescription}`);

    if (anomaly.anomalyFactors && anomaly.anomalyFactors.length > 0) {
      doc.fontSize(12).text("Suspicious Patterns:");
      doc.fontSize(10);
      doc.list(
        anomaly.anomalyFactors.map(
          (factor: any) => factor.description || String(factor)
        ),
        { bulletRadius: 2, textIndent: 20 }
      );
    }

    if (anomaly.recommendations && anomaly.recommendations.length > 0) {
      doc.fontSize(12).text("Anomaly-specific Recommendations:");
      doc.fontSize(10);

      const formattedRecommendations = anomaly.recommendations.map((rec: any) =>
        this.formatRecommendation(rec)
      );

      doc.list(formattedRecommendations, { bulletRadius: 2, textIndent: 20 });
    }

    doc.moveDown();
    this.addDivider(doc);
  }

  /**
   * Add recommendations section to PDF
   */
  private addRecommendations(
    doc: PDFKit.PDFDocument,
    data: AuditReportData
  ): void {
    doc.fontSize(18).text("Recommendations", { underline: true });
    doc.moveDown();

    if (data.recommendations.length === 0) {
      doc.fontSize(12).text("No specific recommendations.");
      doc.moveDown();
      this.addDivider(doc);
      return;
    }

    doc
      .fontSize(12)
      .text("Based on our audit, we recommend the following actions:");
    doc.moveDown(0.5);

    doc.fontSize(10);

    // Format each recommendation
    const formattedRecommendations = data.recommendations.map((rec) =>
      this.formatRecommendation(rec)
    );

    doc.list(formattedRecommendations, { bulletRadius: 2, textIndent: 20 });

    doc.moveDown();
    this.addDivider(doc);
  }

  /**
   * Add contract code to PDF
   */
  private addContractCode(
    doc: PDFKit.PDFDocument,
    data: AuditReportData
  ): void {
    doc.fontSize(18).text("Contract Code", { underline: true });
    doc.moveDown();

    doc.fontSize(10).text("The following code was audited:");
    doc.moveDown(0.5);

    // Create a code block with monospaced font and syntax highlighting
    doc.font("Courier").fontSize(8).text(data.contractContent, {
      paragraphGap: 5,
      indent: 10,
      align: "left",
      lineGap: 1,
    });

    doc.font("Helvetica");
    doc.moveDown();
    this.addDivider(doc);
  }

  /**
   * Add disclaimers to PDF
   */
  private addDisclaimers(doc: PDFKit.PDFDocument): void {
    doc.fontSize(18).text("Disclaimers", { underline: true });
    doc.moveDown();

    doc
      .fontSize(10)
      .text(
        "This report is not an endorsement or indictment of any particular project or team, and the views " +
          "expressed in this report do not necessarily reflect the views of the auditor. The audit makes no " +
          "claims or guarantees about the security or functionality of the audited contract. This audit is not " +
          "investment advice and should not be used as a basis for any investment decisions. This report " +
          "represents a point-in-time analysis of the code and may not reflect the current state of the contract " +
          "if changes have been made after the audit. Please do your own due diligence before using or " +
          "investing in any audited contract."
      );

    doc.moveDown();
  }

  /**
   * Add a divider line to PDF
   */
  private addDivider(doc: PDFKit.PDFDocument): void {
    doc.moveDown();
    doc
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown();
  }

  /* Markdown Report Generation */

  /**
   * Generate markdown content
   */
  private generateMarkdownContent(data: AuditReportData): string {
    let markdown = "";

    // Header
    markdown += `# Smart Contract Security Audit Report\n\n`;
    markdown += `## ${data.contractName}\n\n`;

    if (data.contractAddress) {
      markdown += `**Contract Address:** ${data.contractAddress}\n\n`;
    }

    if (data.contractVersion) {
      markdown += `**Version:** ${data.contractVersion}\n\n`;
    }

    markdown += `**Audit Date:** ${data.auditDate}\n\n`;
    markdown += `**Auditor:** ${data.auditor}\n\n`;

    markdown += `---\n\n`;

    // Executive Summary
    markdown += `## Executive Summary\n\n`;

    if (data.executiveSummary) {
      markdown += `${data.executiveSummary}\n\n`;
    }

    markdown += `**Overall Risk Rating:** ${data.overallRiskRating}\n\n`;

    // Vulnerability Summary
    markdown += `### Vulnerability Summary\n\n`;

    const criticalCount = data.vulnerabilities.filter(
      (v) => v.severity === "Critical"
    ).length;
    const highCount = data.vulnerabilities.filter(
      (v) => v.severity === "High"
    ).length;
    const mediumCount = data.vulnerabilities.filter(
      (v) => v.severity === "Medium"
    ).length;
    const lowCount = data.vulnerabilities.filter(
      (v) => v.severity === "Low"
    ).length;
    const infoCount = data.vulnerabilities.filter(
      (v) => v.severity === "Informational"
    ).length;

    markdown += `- Critical: ${criticalCount}\n`;
    markdown += `- High: ${highCount}\n`;
    markdown += `- Medium: ${mediumCount}\n`;
    markdown += `- Low: ${lowCount}\n`;
    markdown += `- Informational: ${infoCount}\n\n`;

    // Compliance Summary
    markdown += `### Compliance Summary\n\n`;

    const compliantStandards = Object.entries(data.complianceResults)
      .filter(([_, result]) => result.compliant)
      .map(([standard, _]) => standard.toUpperCase());

    const nonCompliantStandards = Object.entries(data.complianceResults)
      .filter(([_, result]) => !result.compliant)
      .map(([standard, _]) => standard.toUpperCase());

    if (compliantStandards.length > 0) {
      markdown += `- Compliant with: ${compliantStandards.join(", ")}\n`;
    }

    if (nonCompliantStandards.length > 0) {
      markdown += `- Non-compliant with: ${nonCompliantStandards.join(", ")}\n`;
    }

    markdown += `\n`;

    // Anomaly Detection Summary
    if (data.anomalyResults) {
      markdown += `### Anomaly Detection\n\n`;

      const anomalyStatus = data.anomalyResults.isAnomaly
        ? "Suspicious patterns detected"
        : "No suspicious patterns detected";

      markdown += `- Status: ${anomalyStatus}\n`;
      markdown += `- Anomaly Score: ${data.anomalyResults.anomalyScore.toFixed(
        2
      )}\n\n`;
    }

    markdown += `---\n\n`;

    // Vulnerabilities
    markdown += `## Vulnerabilities\n\n`;

    if (data.vulnerabilities.length === 0) {
      markdown += `No vulnerabilities detected.\n\n`;
    } else {
      // Group vulnerabilities by severity
      const severities: (
        | "Critical"
        | "High"
        | "Medium"
        | "Low"
        | "Informational"
      )[] = ["Critical", "High", "Medium", "Low", "Informational"];

      for (const severity of severities) {
        const vulns = data.vulnerabilities.filter(
          (v) => v.severity === severity
        );

        if (vulns.length === 0) continue;

        markdown += `### ${severity} Severity (${vulns.length})\n\n`;

        vulns.forEach((vuln, index) => {
          markdown += `#### ${index + 1}. ${vuln.name} (${vuln.id})\n\n`;
          markdown += `**Description:** ${vuln.description}\n\n`;
          markdown += `**Impact:** ${vuln.details}\n\n`;
          markdown += `**Location:** Line ${vuln.location.line}${
            vuln.location.file ? ` in ${vuln.location.file}` : ""
          }\n\n`;
          markdown += `**Recommendation:** ${vuln.recommendation}\n\n`;
        });
      }
    }

    markdown += `---\n\n`;

    // Gas Issues
    markdown += `## Gas Optimization Issues\n\n`;

    if (data.gasIssues.length === 0) {
      markdown += `No gas optimization issues detected.\n\n`;
    } else {
      data.gasIssues.forEach((issue, index) => {
        markdown += `### ${index + 1}. ${issue.description}\n\n`;
        markdown += `**Location:** Line ${issue.location.line}${
          issue.location.file ? ` in ${issue.location.file}` : ""
        }\n\n`;
        markdown += `**Potential Gas Savings:** ${issue.gasSaved}\n\n`;
        markdown += `**Recommendation:** ${issue.recommendation}\n\n`;
      });
    }

    markdown += `---\n\n`;

    // Compliance Results
    markdown += `## Standard Compliance\n\n`;

    for (const [standard, result] of Object.entries(data.complianceResults)) {
      const standardUpper = standard.toUpperCase();
      markdown += `### ${standardUpper} Standard\n\n`;

      const status = result.compliant ? "Compliant ✓" : "Non-compliant ✗";
      markdown += `**Status:** ${status}\n\n`;

      if (!result.compliant && result.missingRequirements.length > 0) {
        markdown += `**Missing Requirements:**\n\n`;
        result.missingRequirements.forEach((req) => {
          markdown += `- ${req}\n`;
        });
        markdown += `\n`;
      }

      if (result.recommendations.length > 0) {
        markdown += `**Recommendations:**\n\n`;
        result.recommendations.forEach((rec) => {
          markdown += `- ${rec}\n`;
        });
        markdown += `\n`;
      }
    }

    markdown += `---\n\n`;

    // Anomaly Results
    if (data.anomalyResults) {
      markdown += `## Anomaly Detection Results\n\n`;

      const anomaly = data.anomalyResults;
      const status = anomaly.isAnomaly ? "Anomalous ⚠" : "Normal ✓";

      markdown += `**Status:** ${status}\n\n`;
      markdown += `**Anomaly Score:** ${anomaly.anomalyScore.toFixed(2)}\n\n`;
      markdown += `**Description:** ${anomaly.anomalyDescription}\n\n`;

      if (anomaly.anomalyFactors && anomaly.anomalyFactors.length > 0) {
        markdown += `**Suspicious Patterns:**\n\n`;
        anomaly.anomalyFactors.forEach((factor: any) => {
          markdown += `- ${factor.description || String(factor)}\n`;
        });
        markdown += `\n`;
      }

      if (anomaly.recommendations && anomaly.recommendations.length > 0) {
        markdown += `**Anomaly-specific Recommendations:**\n\n`;
        anomaly.recommendations.forEach((rec) => {
          markdown += `- ${this.formatRecommendation(rec)}\n`;
        });
        markdown += `\n`;
      }

      markdown += `---\n\n`;
    }

    // Recommendations
    markdown += `## Recommendations\n\n`;

    if (data.recommendations.length === 0) {
      markdown += `No specific recommendations.\n\n`;
    } else {
      markdown += `Based on our audit, we recommend the following actions:\n\n`;

      data.recommendations.forEach((rec) => {
        markdown += `- ${this.formatRecommendation(rec)}\n`;
      });

      markdown += `\n`;
    }

    markdown += `---\n\n`;

    // Contract Code
    markdown += `## Contract Code\n\n`;
    markdown += `The following code was audited:\n\n`;
    markdown += "```solidity\n";
    markdown += data.contractContent;
    markdown += "\n```\n\n";

    markdown += `---\n\n`;

    // Disclaimers
    markdown += `## Disclaimers\n\n`;
    markdown += `This report is not an endorsement or indictment of any particular project or team, and the views expressed in this report do not necessarily reflect the views of the auditor. The audit makes no claims or guarantees about the security or functionality of the audited contract. This audit is not investment advice and should not be used as a basis for any investment decisions. This report represents a point-in-time analysis of the code and may not reflect the current state of the contract if changes have been made after the audit. Please do your own due diligence before using or investing in any audited contract.\n`;

    return markdown;
  }

  /**
   * Simple markdown to HTML converter
   * In a real implementation, use a proper library for this
   */
  private markdownToHTML(markdown: string): string {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Smart Contract Security Audit Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4 { color: #333; }
    h1 { border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-top: 30px; }
    pre {
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
    }
    code { font-family: Consolas, monospace; }
    hr { border: 1px solid #eee; margin: 30px 0; }
    table { border-collapse: collapse; width: 100%; }
    th, td { text-align: left; padding: 8px; border: 1px solid #ddd; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .critical { color: #7F0000; }
    .high { color: #FF0000; }
    .medium { color: #FFA500; }
    .low { color: #FFFF00; background-color: #f9f9f9; }
    .informational { color: #00FF00; }
  </style>
</head>
<body>`;

    // Very simple markdown to HTML conversion - for a real implementation use a proper library
    html += markdown
      // Headers
      .replace(/^# (.*$)/gm, "<h1>$1</h1>")
      .replace(/^## (.*$)/gm, "<h2>$1</h2>")
      .replace(/^### (.*$)/gm, "<h3>$1</h3>")
      .replace(/^#### (.*$)/gm, "<h4>$1</h4>")
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Lists
      .replace(/^\- (.*$)/gm, "<li>$1</li>")
      // Code blocks
      .replace(
        /```(.+?)\n([\s\S]*?)```/gm,
        (match, language, code) =>
          `<pre><code class="language-${language}">${code}</code></pre>`
      )
      // Line breaks
      .replace(/\n\n/g, "</p><p>");
    // Other elements would follow...

    html += `</body></html>`;
    return html;
  }
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
    reportData: AuditReportData
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
        status: "pending",
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
  /**
   * Process the report generation job
   * This method is used by the queue worker
   */
  /**
   * Process the report generation job
   * This method is used by the queue worker
   */
  public async processReportGeneration(
    contractId: string,
    analysisId: string,
    formats: ReportFormat[],
    reportData: AuditReportData,
    timestamp: number,
    reportId?: string
  ): Promise<void> {
    try {
      // Update report status to generating
      if (reportId) {
        await Report.findByIdAndUpdate(reportId, { status: "generating" });
      }

      const contractDir = path.join(this.reportsDir, contractId);
      // Initialize with all enum values as keys with empty strings
      const generatedFilePaths: Record<ReportFormat, string> = {
        pdf: "",
        html: "",
        json: "",
        markdown: "",
      };
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

          // Update report status on failure
          const updateQuery = reportId
            ? { _id: reportId }
            : { contractId, analysisId };

          await Report.findOneAndUpdate(updateQuery, {
            status: "failed",
            error: error instanceof Error ? error.message : String(error),
          });

          throw error;
        }
      }

      // Update report record with file paths and mark as completed
      const updateQuery = reportId
        ? { _id: reportId }
        : { contractId, analysisId };

      await Report.findOneAndUpdate(updateQuery, {
        filePaths: generatedFilePaths,
        availableFormats,
        status: "completed",
      });

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
  private generateSummary(reportData: AuditReportData): string {
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
