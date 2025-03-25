"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditReportGenerator = void 0;
const fs = __importStar(require("fs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
class AuditReportGenerator {
    /**
     * Generate a comprehensive audit report in PDF format
     */
    generatePDFReport(data, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new pdfkit_1.default({ margin: 50 });
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
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Generate a markdown report
     */
    generateMarkdownReport(data, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const markdown = this.generateMarkdownContent(data);
                fs.writeFileSync(outputPath, markdown);
                resolve(outputPath);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Generate JSON report
     */
    generateJSONReport(data, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
                resolve(outputPath);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Generate HTML report
     */
    generateHTMLReport(data, outputPath) {
        return new Promise((resolve, reject) => {
            try {
                const markdown = this.generateMarkdownContent(data);
                // Convert markdown to HTML - in a real implementation, use a proper markdown to HTML converter
                const html = this.markdownToHTML(markdown);
                fs.writeFileSync(outputPath, html);
                resolve(outputPath);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /* PDF Report Sections */
    /**
     * Add report header to PDF
     */
    addReportHeader(doc, data) {
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
    addExecutiveSummary(doc, data) {
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
        const criticalCount = data.vulnerabilities.filter((v) => v.severity === "Critical").length;
        const highCount = data.vulnerabilities.filter((v) => v.severity === "High").length;
        const mediumCount = data.vulnerabilities.filter((v) => v.severity === "Medium").length;
        const lowCount = data.vulnerabilities.filter((v) => v.severity === "Low").length;
        const infoCount = data.vulnerabilities.filter((v) => v.severity === "Informational").length;
        doc.fontSize(10);
        doc.list([
            `Critical: ${criticalCount}`,
            `High: ${highCount}`,
            `Medium: ${mediumCount}`,
            `Low: ${lowCount}`,
            `Informational: ${infoCount}`,
        ], { bulletRadius: 2, textIndent: 20 });
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
    addVulnerabilities(doc, data) {
        doc.fontSize(18).text("Vulnerabilities", { underline: true });
        doc.moveDown();
        if (data.vulnerabilities.length === 0) {
            doc.fontSize(12).text("No vulnerabilities detected.");
            doc.moveDown();
            this.addDivider(doc);
            return;
        }
        // Group vulnerabilities by severity
        const severities = ["Critical", "High", "Medium", "Low", "Informational"];
        for (const severity of severities) {
            const vulns = data.vulnerabilities.filter((v) => v.severity === severity);
            if (vulns.length === 0)
                continue;
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
                    .text(`Location: Line ${vuln.location.line}${vuln.location.file ? ` in ${vuln.location.file}` : ""}`);
                doc.fontSize(10).text(`Recommendation: ${vuln.recommendation}`);
                doc.moveDown();
            });
        }
        this.addDivider(doc);
    }
    /**
     * Add gas issues section to PDF
     */
    addGasIssues(doc, data) {
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
                .text(`Location: Line ${issue.location.line}${issue.location.file ? ` in ${issue.location.file}` : ""}`);
            doc.fontSize(10).text(`Potential Gas Savings: ${issue.gasSaved}`);
            doc.fontSize(10).text(`Recommendation: ${issue.recommendation}`);
            doc.moveDown();
        });
        this.addDivider(doc);
    }
    /**
     * Add compliance results section to PDF
     */
    addComplianceResults(doc, data) {
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
    addAnomalyResults(doc, data) {
        if (!data.anomalyResults)
            return;
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
            doc.list(anomaly.anomalyFactors.map((factor) => factor.description || String(factor)), { bulletRadius: 2, textIndent: 20 });
        }
        if (anomaly.recommendations && anomaly.recommendations.length > 0) {
            doc.fontSize(12).text("Anomaly-specific Recommendations:");
            doc.fontSize(10);
            doc.list(anomaly.recommendations, { bulletRadius: 2, textIndent: 20 });
        }
        doc.moveDown();
        this.addDivider(doc);
    }
    /**
     * Add recommendations section to PDF
     */
    addRecommendations(doc, data) {
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
        doc.list(data.recommendations, { bulletRadius: 2, textIndent: 20 });
        doc.moveDown();
        this.addDivider(doc);
    }
    /**
     * Add contract code to PDF
     */
    addContractCode(doc, data) {
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
    addDisclaimers(doc) {
        doc.fontSize(18).text("Disclaimers", { underline: true });
        doc.moveDown();
        doc
            .fontSize(10)
            .text("This report is not an endorsement or indictment of any particular project or team, and the views " +
            "expressed in this report do not necessarily reflect the views of the auditor. The audit makes no " +
            "claims or guarantees about the security or functionality of the audited contract. This audit is not " +
            "investment advice and should not be used as a basis for any investment decisions. This report " +
            "represents a point-in-time analysis of the code and may not reflect the current state of the contract " +
            "if changes have been made after the audit. Please do your own due diligence before using or " +
            "investing in any audited contract.");
        doc.moveDown();
    }
    /**
     * Add a divider line to PDF
     */
    addDivider(doc) {
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
    generateMarkdownContent(data) {
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
        const criticalCount = data.vulnerabilities.filter((v) => v.severity === "Critical").length;
        const highCount = data.vulnerabilities.filter((v) => v.severity === "High").length;
        const mediumCount = data.vulnerabilities.filter((v) => v.severity === "Medium").length;
        const lowCount = data.vulnerabilities.filter((v) => v.severity === "Low").length;
        const infoCount = data.vulnerabilities.filter((v) => v.severity === "Informational").length;
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
            markdown += `- Anomaly Score: ${data.anomalyResults.anomalyScore.toFixed(2)}\n\n`;
        }
        markdown += `---\n\n`;
        // Vulnerabilities
        markdown += `## Vulnerabilities\n\n`;
        if (data.vulnerabilities.length === 0) {
            markdown += `No vulnerabilities detected.\n\n`;
        }
        else {
            // Group vulnerabilities by severity
            const severities = ["Critical", "High", "Medium", "Low", "Informational"];
            for (const severity of severities) {
                const vulns = data.vulnerabilities.filter((v) => v.severity === severity);
                if (vulns.length === 0)
                    continue;
                markdown += `### ${severity} Severity (${vulns.length})\n\n`;
                vulns.forEach((vuln, index) => {
                    markdown += `#### ${index + 1}. ${vuln.name} (${vuln.id})\n\n`;
                    markdown += `**Description:** ${vuln.description}\n\n`;
                    markdown += `**Impact:** ${vuln.details}\n\n`;
                    markdown += `**Location:** Line ${vuln.location.line}${vuln.location.file ? ` in ${vuln.location.file}` : ""}\n\n`;
                    markdown += `**Recommendation:** ${vuln.recommendation}\n\n`;
                });
            }
        }
        markdown += `---\n\n`;
        // Gas Issues
        markdown += `## Gas Optimization Issues\n\n`;
        if (data.gasIssues.length === 0) {
            markdown += `No gas optimization issues detected.\n\n`;
        }
        else {
            data.gasIssues.forEach((issue, index) => {
                markdown += `### ${index + 1}. ${issue.description}\n\n`;
                markdown += `**Location:** Line ${issue.location.line}${issue.location.file ? ` in ${issue.location.file}` : ""}\n\n`;
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
                anomaly.anomalyFactors.forEach((factor) => {
                    markdown += `- ${factor.description || String(factor)}\n`;
                });
                markdown += `\n`;
            }
            if (anomaly.recommendations && anomaly.recommendations.length > 0) {
                markdown += `**Anomaly-specific Recommendations:**\n\n`;
                anomaly.recommendations.forEach((rec) => {
                    markdown += `- ${rec}\n`;
                });
                markdown += `\n`;
            }
            markdown += `---\n\n`;
        }
        // Recommendations
        markdown += `## Recommendations\n\n`;
        if (data.recommendations.length === 0) {
            markdown += `No specific recommendations.\n\n`;
        }
        else {
            markdown += `Based on our audit, we recommend the following actions:\n\n`;
            data.recommendations.forEach((rec) => {
                markdown += `- ${rec}\n`;
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
    markdownToHTML(markdown) {
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
            .replace(/```(.+?)\n([\s\S]*?)```/gm, (match, language, code) => `<pre><code class="language-${language}">${code}</code></pre>`)
            // Line breaks
            .replace(/\n\n/g, "</p><p>");
        // Other elements would follow...
        html += `</body></html>`;
        return html;
    }
}
exports.AuditReportGenerator = AuditReportGenerator;
// Example usage:
/*
const generator = new AuditReportGenerator();
const reportData: AuditReportData = {
  contractName: "SampleToken",
  contractAddress: "0x123abc...",
  contractVersion: "1.0.0",
  auditDate: "2023-12-15",
  auditor: "Smart Contract Audit Platform",
  contractContent: "// SPDX-License-Identifier: MIT\npragma solidity ^0.8.0;...",
  vulnerabilities: [
    // Vulnerability findings from SecurityScanner
  ],
  gasIssues: [
    // Gas optimization issues from GasOptimizer
  ],
  complianceResults: {
    // Compliance results from StandardComplianceChecker
  },
  anomalyResults: {
    // Anomaly detection results
  },
  overallRiskRating: "Medium",
  recommendations: [
    "Fix the high severity reentrancy vulnerability",
    "Implement checks-effects-interactions pattern",
    "Add proper access control to critical functions"
  ]
};

// Generate reports
generator.generatePDFReport(reportData, 'audit-report.pdf')
  .then(pdfPath => console.log(`PDF report generated: ${pdfPath}`))
  .catch(error => console.error(`Error generating PDF report: ${error}`));

generator.generateMarkdownReport(reportData, 'audit-report.md')
  .then(mdPath => console.log(`Markdown report generated: ${mdPath}`))
  .catch(error => console.error(`Error generating markdown report: ${error}`));
*/
