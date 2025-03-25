"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeContract = analyzeContract;
exports.validateContract = validateContract;
// @ts-ignore
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_1 = require("./index");
// Create Express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001;
// Configure middleware
app.use(express_1.default.json({ limit: "5mb" }));
app.use((0, cors_1.default)());
/**
 * Analyze a smart contract
 */
function analyzeContract(request) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { sourceCode, fileName = "Contract.sol", contractName = "Unknown", } = request;
            if (!sourceCode) {
                return {
                    success: false,
                    contractName,
                    vulnerabilities: [],
                    gasIssues: [],
                    overallRiskRating: "Unknown",
                    timestamp: new Date().toISOString(),
                    error: "Source code is required",
                };
            }
            // Run security scan
            const securityScanner = new index_1.SecurityScanner(sourceCode, fileName);
            const vulnerabilities = securityScanner.scan();
            // Run gas optimization
            const gasOptimizer = new index_1.GasOptimizer(sourceCode, fileName);
            const gasIssues = gasOptimizer.analyze();
            // Determine risk level
            let overallRiskRating = "Low";
            if (vulnerabilities.some((v) => v.severity === "Critical")) {
                overallRiskRating = "Critical";
            }
            else if (vulnerabilities.some((v) => v.severity === "High")) {
                overallRiskRating = "High";
            }
            else if (vulnerabilities.some((v) => v.severity === "Medium")) {
                overallRiskRating = "Medium";
            }
            return {
                success: true,
                contractName,
                vulnerabilities,
                gasIssues,
                overallRiskRating,
                timestamp: new Date().toISOString(),
            };
        }
        catch (error) {
            console.error("Error analyzing contract:", error);
            return {
                success: false,
                contractName: request.contractName || "Unknown",
                vulnerabilities: [],
                gasIssues: [],
                overallRiskRating: "Unknown",
                timestamp: new Date().toISOString(),
                error: error instanceof Error ? error.message : String(error),
            };
        }
    });
}
/**
 * Validate if a contract is valid Solidity
 */
function validateContract(request) {
    try {
        const { sourceCode, fileName = "Contract.sol", contractName = "Unknown", } = request;
        if (!sourceCode) {
            return {
                success: false,
                isValid: false,
                message: "Source code is required",
            };
        }
        const analyzer = new index_1.SmartContractAnalyzer(sourceCode, contractName, fileName);
        const isValid = analyzer.isValidSolidity();
        return {
            success: true,
            isValid,
            message: isValid ? "Valid Solidity code" : "Invalid Solidity code",
        };
    }
    catch (error) {
        console.error("Error validating contract:", error);
        return {
            success: false,
            isValid: false,
            message: error instanceof Error ? error.message : String(error),
        };
    }
}
// API Endpoints
// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({ status: "healthy" });
});
// Analyze contract endpoint
app.post("/api/analyze", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield analyzeContract(req.body);
        res.status(result.success ? 200 : 400).json(result);
    }
    catch (error) {
        console.error("Error in analyze endpoint:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
}));
// Validate contract endpoint
app.post("/api/validate", (req, res) => {
    try {
        const result = validateContract(req.body);
        res.status(result.success ? 200 : 400).json(result);
    }
    catch (error) {
        console.error("Error in validate endpoint:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Analysis Engine server running on port ${PORT}`);
});
// For module usage
exports.default = app;
