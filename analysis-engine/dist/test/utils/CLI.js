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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLI = void 0;
// src/utils/CLI.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const SecurityScanner_1 = require("../../src/analyzers/SecurityScanner");
const GasOptimizer_1 = require("../../src/analyzers/GasOptimizer");
class CLI {
    /**
     * Run the analysis on a file
     */
    static analyzeFile(filePath) {
        try {
            const fullPath = path.resolve(filePath);
            const sourceCode = fs.readFileSync(fullPath, "utf8");
            const fileName = path.basename(fullPath);
            console.log(`Analyzing ${fileName}...`);
            // Run security scan
            console.log("\nSecurity Scan Results:");
            const securityScanner = new SecurityScanner_1.SecurityScanner(sourceCode, fileName);
            const securityResults = securityScanner.scan();
            if (securityResults.length === 0) {
                console.log("No security issues detected.");
            }
            else {
                console.log(`Found ${securityResults.length} security issues:`);
                securityResults.forEach((issue, index) => {
                    console.log(`\n[${index + 1}] ${issue.name} (${issue.severity})`);
                    console.log(`   Location: Line ${issue.location.line}`);
                    console.log(`   Description: ${issue.description}`);
                    console.log(`   Recommendation: ${issue.recommendation}`);
                });
            }
            // Run gas optimization
            console.log("\nGas Optimization Results:");
            const gasOptimizer = new GasOptimizer_1.GasOptimizer(sourceCode, fileName);
            const gasResults = gasOptimizer.analyze();
            if (gasResults.length === 0) {
                console.log("No gas optimization opportunities detected.");
            }
            else {
                console.log(`Found ${gasResults.length} gas optimization opportunities:`);
                gasResults.forEach((issue, index) => {
                    console.log(`\n[${index + 1}] ${issue.description}`);
                    console.log(`   Location: Line ${issue.location.line}`);
                    console.log(`   Potential Gas Savings: ${issue.gasSaved}`);
                    console.log(`   Recommendation: ${issue.recommendation}`);
                });
            }
        }
        catch (error) {
            console.error("Error analyzing file:", error);
            process.exit(1);
        }
    }
}
exports.CLI = CLI;
// When run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Please provide a Solidity file path to analyze");
        process.exit(1);
    }
    CLI.analyzeFile(args[0]);
}
