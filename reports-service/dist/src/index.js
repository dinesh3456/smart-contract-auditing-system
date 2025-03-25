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
exports.ReportGenerator = void 0;
const fs = __importStar(require("fs"));
const pdfkit_1 = __importDefault(require("pdfkit"));
class ReportGenerator {
    /**
     * Generate a PDF report
     */
    generatePDFReport(data, outputPath) {
        const doc = new pdfkit_1.default({ margin: 50 });
        // Stream output to file
        const stream = fs.createWriteStream(outputPath);
        doc.pipe(stream);
        // Add content to the PDF
        this.addReportHeader(doc, data);
        this.addSummary(doc, data);
        this.addVulnerabilities(doc, data);
        this.addGasIssues(doc, data);
        this.addComplianceResults(doc, data);
        if (data.anomalyResults) {
            this.addAnomalyResults(doc, data);
        }
        this.addRecommendations(doc, data);
        // Finalize PDF
        doc.end();
    }
    /**
     * Generate a JSON report
     */
    generateJSONReport(data, outputPath) {
        fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    }
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
        doc.moveDown();
        doc.fontSize(12).text(`Audit Date: ${data.auditDate}`, { align: "center" });
        doc.fontSize(12).text(`Auditor: ${data.auditor}`, { align: "center" });
        doc.moveDown();
        this.addDivider(doc);
    }
    /**
     * Add summary section to PDF
     */
    addSummary(doc, data) {
        doc.fontSize(18).text("Executive Summary", { underline: true });
        doc.moveDown();
        // Add overall score
        doc.fontSize(12).text(`Overall Security Score: ${data.overallScore}/100`);
        // Add vulnerability summary
        doc.moveDown();
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
            return;
        }
        // Group vulnerabilities by severity
        const severities = ["Critical", "High", "Medium", "Low", "Informational"];
        for (const severity of severities) {
            const vulns = data.vulnerabilities.filter((v) => v.severity === severity);
            if (vulns.length === 0)
                continue;
            doc.fontSize(16).text(`${severity} Severity (${vulns.length})`);
            doc.moveDown();
            vulns.forEach((vuln, index) => {
                doc.fontSize(14).text(`${index + 1}. ${vuln.name} (${vuln.id})`);
                doc.fontSize(10).text(`Description: ${vuln.description}`);
                doc.fontSize(10).text(`Impact: ${vuln.impact}`);
                doc.fontSize(10).text(`Location: ${vuln.location}`);
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
            return;
        }
        data.gasIssues.forEach((issue, index) => {
            doc.fontSize(14).text(`${index + 1}. ${issue.description} (${issue.id})`);
            doc.fontSize(10).text(`Location: ${issue.location}`);
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
        Object.entries(data.complianceResults).forEach(([standard, result]) => {
            const standardUpper = standard.toUpperCase();
            doc.fontSize(16).text(`${standardUpper} Standard`);
            const status = result.compliant ? "Compliant ✓" : "Non-compliant ✗";
            doc.fontSize(12).text(`Status: ${status}`);
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
        });
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
        doc.fontSize(12).text(`Status: ${status}`);
        doc.fontSize(12).text(`Anomaly Score: ${anomaly.anomalyScore.toFixed(2)}`);
        doc.fontSize(12).text(`Description: ${anomaly.anomalyDescription}`);
        if (Object.keys(anomaly.details).length > 0) {
            doc.fontSize(12).text("Details:");
            Object.entries(anomaly.details).forEach(([key, value]) => {
                doc.fontSize(10).text(`${key}: ${value}`);
            });
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
            return;
        }
        doc
            .fontSize(12)
            .text("Based on our audit, we recommend the following actions:");
        doc.moveDown(0.5);
        doc.fontSize(10);
        doc.list(data.recommendations, { bulletRadius: 2, textIndent: 20 });
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
}
exports.ReportGenerator = ReportGenerator;
// Example usage:
// const generator = new ReportGenerator();
// generator.generatePDFReport(reportData, 'report.pdf');
// generator.generateJSONReport(reportData, 'report.json');
