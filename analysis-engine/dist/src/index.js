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
exports.GasOptimizer = exports.SecurityScanner = exports.SmartContractAnalyzer = void 0;
exports.analyzeContract = analyzeContract;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const solc_1 = __importDefault(require("solc"));
const SecurityScanner_1 = require("./analyzers/SecurityScanner");
Object.defineProperty(exports, "SecurityScanner", { enumerable: true, get: function () { return SecurityScanner_1.SecurityScanner; } });
const GasOptimizer_1 = require("./analyzers/GasOptimizer");
Object.defineProperty(exports, "GasOptimizer", { enumerable: true, get: function () { return GasOptimizer_1.GasOptimizer; } });
class SmartContractAnalyzer {
    constructor(sourceCode, contractName, fileName = "Contract.sol", solcVersion = "") {
        this.compilationResult = null;
        this.sourceCode = sourceCode;
        this.contractName = contractName;
        this.fileName = fileName;
        this.solcVersion = solcVersion;
    }
    /**
     * Compile the smart contract
     */
    compile() {
        const input = {
            language: "Solidity",
            sources: {
                [this.fileName]: {
                    content: this.sourceCode,
                },
            },
            settings: {
                outputSelection: {
                    "*": {
                        "*": ["*"],
                    },
                },
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
            },
        };
        try {
            // Compile the contract
            const output = JSON.parse(solc_1.default.compile(JSON.stringify(input)));
            // Check for errors
            if (output.errors) {
                const errors = output.errors.map((error) => ({
                    message: error.message || "Unknown error",
                    type: error.type || "Unknown",
                    severity: error.severity || "error",
                    sourceLocation: error.sourceLocation,
                }));
                const hasError = errors.some((error) => error.severity === "error");
                if (hasError) {
                    return {
                        success: false,
                        errors,
                    };
                }
                // Compilation succeeded with warnings
                return {
                    success: true,
                    output,
                    errors: errors.filter((e) => e.severity !== "error"),
                    contractNames: this.extractContractNames(output),
                };
            }
            // Compilation succeeded without errors
            return {
                success: true,
                output,
                contractNames: this.extractContractNames(output),
            };
        }
        catch (error) {
            console.error("Compilation error:", error);
            return {
                success: false,
                errors: [
                    {
                        message: error instanceof Error
                            ? error.message
                            : "Unknown error during compilation",
                        type: "CompilationError",
                        severity: "error",
                    },
                ],
            };
        }
    }
    /**
     * Extract contract names from compilation output
     */
    extractContractNames(output) {
        const contractNames = [];
        if (output.contracts) {
            for (const fileName in output.contracts) {
                for (const contractName in output.contracts[fileName]) {
                    contractNames.push(contractName);
                }
            }
        }
        return contractNames;
    }
    /**
     * Check if source code is valid Solidity
     */
    isValidSolidity() {
        try {
            const result = this.compile();
            return result.success;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Run a comprehensive analysis on the smart contract
     */
    analyze() {
        // Compile the contract if not already compiled
        if (!this.compilationResult) {
            this.compilationResult = this.compile();
            if (!this.compilationResult.success) {
                throw new Error("Contract compilation failed. Cannot proceed with analysis.");
            }
        }
        // Run security analysis
        const vulnerabilities = this.detectVulnerabilities();
        // Run gas optimization analysis
        const gasIssues = this.detectGasIssues();
        // Run code quality analysis
        const codeQuality = this.detectCodeQualityIssues();
        // Calculate risk score
        const riskScore = this.calculateRiskScore(vulnerabilities);
        // Determine overall risk level
        const riskLevel = this.determineRiskLevel(riskScore, vulnerabilities);
        // Get compiler version from solc
        let compilerVersion = this.solcVersion || solc_1.default.version();
        if (typeof compilerVersion === "object" && compilerVersion.version) {
            compilerVersion = compilerVersion.version;
        }
        // Return comprehensive analysis result
        return {
            contractName: this.contractName,
            sourceCode: this.sourceCode,
            vulnerabilities,
            gasIssues,
            codeQuality,
            overallRiskScore: riskScore,
            riskLevel,
            compilerVersion: compilerVersion,
            compilerWarnings: this.compilationResult.errors,
            timestamp: new Date().toISOString(),
        };
    }
    /**
     * Detect common vulnerabilities
     */
    detectVulnerabilities() {
        const securityScanner = new SecurityScanner_1.SecurityScanner(this.sourceCode, this.fileName);
        // Convert SecurityScanner findings to the expected Vulnerability format
        return securityScanner.scan().map((finding) => {
            return {
                id: finding.id,
                name: finding.name,
                description: finding.description,
                severity: finding.severity,
                location: {
                    file: finding.location.file || this.fileName,
                    line: finding.location.line,
                    column: finding.location.column,
                },
                details: finding.details,
                recommendation: finding.recommendation,
            };
        });
    }
    /**
     * Detect gas optimization issues
     */
    detectGasIssues() {
        const gasOptimizer = new GasOptimizer_1.GasOptimizer(this.sourceCode, this.fileName);
        // Get the optimizer issues
        const optimizerIssues = gasOptimizer.analyze();
        // Map to our expected format
        return optimizerIssues.map((issue) => {
            return {
                id: issue.id,
                description: issue.description,
                location: {
                    file: issue.location.file || this.fileName,
                    line: issue.location.line,
                    column: issue.location.column,
                },
                potential_savings: issue.gasSaved, // Rename field from gasSaved to potential_savings
                recommendation: issue.recommendation,
            };
        });
    }
    /**
     * Detect code quality issues
     */
    detectCodeQualityIssues() {
        // This is a placeholder for future implementation
        // In a real implementation, this would analyze code style, best practices, etc.
        return [];
    }
    /**
     * Calculate an overall risk score for the contract
     * Returns a score between 0 (no risk) and 100 (highest risk)
     */
    calculateRiskScore(vulnerabilities) {
        // Weight vulnerabilities by severity
        const weights = {
            Critical: 100,
            High: 50,
            Medium: 20,
            Low: 5,
            Informational: 1,
        };
        // Count vulnerabilities by severity
        const counts = {
            Critical: vulnerabilities.filter((v) => v.severity === "Critical").length,
            High: vulnerabilities.filter((v) => v.severity === "High").length,
            Medium: vulnerabilities.filter((v) => v.severity === "Medium").length,
            Low: vulnerabilities.filter((v) => v.severity === "Low").length,
            Informational: vulnerabilities.filter((v) => v.severity === "Informational").length,
        };
        // Calculate weighted score
        let score = 0;
        let maxScore = 100;
        score += Math.min(100, counts.Critical * weights.Critical);
        if (counts.Critical === 0) {
            score += Math.min(70, counts.High * weights.High);
            if (counts.High === 0) {
                score += Math.min(40, counts.Medium * weights.Medium);
                if (counts.Medium === 0) {
                    score += Math.min(20, counts.Low * weights.Low);
                    if (counts.Low === 0) {
                        score += Math.min(5, counts.Informational * weights.Informational);
                    }
                }
            }
        }
        // Ensure score is between 0 and 100
        return Math.min(100, Math.max(0, score));
    }
    /**
     * Determine the overall risk level based on the risk score and vulnerabilities
     */
    determineRiskLevel(score, vulnerabilities) {
        // Check for critical vulnerabilities first
        if (vulnerabilities.some((v) => v.severity === "Critical")) {
            return "Critical";
        }
        // Then determine by score
        if (score >= 75) {
            return "Critical";
        }
        else if (score >= 50) {
            return "High";
        }
        else if (score >= 25) {
            return "Medium";
        }
        else if (score >= 5) {
            return "Low";
        }
        else {
            return "Informational";
        }
    }
}
exports.SmartContractAnalyzer = SmartContractAnalyzer;
// Helper function for CLI usage
function analyzeContract(filePath) {
    try {
        const sourceCode = fs.readFileSync(filePath, "utf8");
        const fileName = path.basename(filePath);
        const contractName = fileName.replace(".sol", "");
        const analyzer = new SmartContractAnalyzer(sourceCode, contractName, fileName);
        return analyzer.analyze();
    }
    catch (error) {
        throw new Error(`Failed to analyze contract: ${error instanceof Error ? error.message : String(error)}`);
    }
}
// When run directly from command line
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Please provide a path to a Solidity file");
        process.exit(1);
    }
    try {
        const result = analyzeContract(args[0]);
        console.log(JSON.stringify(result, null, 2));
    }
    catch (error) {
        console.error("Error:", error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
