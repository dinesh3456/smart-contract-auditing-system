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
exports.ERC721Checker = exports.ERC20Checker = exports.ComplianceChecker = void 0;
const parser = __importStar(require("@solidity-parser/parser"));
const ERC20Checker_1 = require("./standards/ERC20Checker");
Object.defineProperty(exports, "ERC20Checker", { enumerable: true, get: function () { return ERC20Checker_1.ERC20Checker; } });
const ERC721Checker_1 = require("./standards/ERC721Checker");
Object.defineProperty(exports, "ERC721Checker", { enumerable: true, get: function () { return ERC721Checker_1.ERC721Checker; } });
class ComplianceChecker {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
    }
    /**
     * Parse the contract to an AST
     */
    parseContract() {
        try {
            return parser.parse(this.sourceCode, { loc: true });
        }
        catch (error) {
            console.error("Error parsing contract:", error);
            throw error;
        }
    }
    /**
     * Check if the contract is ERC20 compliant
     */
    checkERC20Compliance() {
        const ast = this.parseContract();
        // Required functions for ERC20
        const requiredFunctions = [
            "totalSupply",
            "balanceOf",
            "transfer",
            "transferFrom",
            "approve",
            "allowance",
        ];
        // Required events for ERC20
        const requiredEvents = ["Transfer", "Approval"];
        // Check for functions and events in AST
        const foundFunctions = [];
        const foundEvents = [];
        // Simple AST traversal to find functions and events
        // In a real implementation, this would be more robust
        parser.visit(ast, {
            FunctionDefinition: (node) => {
                if (node.name && requiredFunctions.includes(node.name)) {
                    foundFunctions.push(node.name);
                }
            },
            EventDefinition: (node) => {
                if (node.name && requiredEvents.includes(node.name)) {
                    foundEvents.push(node.name);
                }
            },
        });
        // Determine missing requirements
        const missingFunctions = requiredFunctions.filter((f) => !foundFunctions.includes(f));
        const missingEvents = requiredEvents.filter((e) => !foundEvents.includes(e));
        // Build result
        const result = {
            standard: "ERC20",
            compliant: missingFunctions.length === 0 && missingEvents.length === 0,
            missingRequirements: [
                ...missingFunctions.map((f) => `Missing function: ${f}`),
                ...missingEvents.map((e) => `Missing event: ${e}`),
            ],
            recommendations: [],
            details: {
                requiredFunctions: requiredFunctions.map((name) => ({
                    name,
                    found: foundFunctions.includes(name),
                })),
                requiredEvents: requiredEvents.map((name) => ({
                    name,
                    found: foundEvents.includes(name),
                })),
                requiredState: [],
            },
        };
        // Add recommendations if not compliant
        if (!result.compliant) {
            result.recommendations.push("Implement all required ERC20 functions and events to ensure compatibility.");
            if (missingEvents.length > 0) {
                result.recommendations.push("Events are crucial for off-chain applications to track token transfers and approvals.");
            }
        }
        return result;
    }
    /**
     * Check if the contract is ERC721 (NFT) compliant
     */
    checkERC721Compliance() {
        const ast = this.parseContract();
        // Required functions for ERC721
        const requiredFunctions = [
            "balanceOf",
            "ownerOf",
            "safeTransferFrom",
            "transferFrom",
            "approve",
            "getApproved",
            "setApprovalForAll",
            "isApprovedForAll",
        ];
        // Required events for ERC721
        const requiredEvents = ["Transfer", "Approval", "ApprovalForAll"];
        // Check for functions and events in AST
        const foundFunctions = [];
        const foundEvents = [];
        // Simple AST traversal to find functions and events
        parser.visit(ast, {
            FunctionDefinition: (node) => {
                if (node.name && requiredFunctions.includes(node.name)) {
                    foundFunctions.push(node.name);
                }
            },
            EventDefinition: (node) => {
                if (node.name && requiredEvents.includes(node.name)) {
                    foundEvents.push(node.name);
                }
            },
        });
        // Determine missing requirements
        const missingFunctions = requiredFunctions.filter((f) => !foundFunctions.includes(f));
        const missingEvents = requiredEvents.filter((e) => !foundEvents.includes(e));
        // Build result
        const result = {
            standard: "ERC721",
            compliant: missingFunctions.length === 0 && missingEvents.length === 0,
            missingRequirements: [
                ...missingFunctions.map((f) => `Missing function: ${f}`),
                ...missingEvents.map((e) => `Missing event: ${e}`),
            ],
            recommendations: [],
            details: {
                requiredFunctions: requiredFunctions.map((name) => ({
                    name,
                    found: foundFunctions.includes(name),
                })),
                requiredEvents: requiredEvents.map((name) => ({
                    name,
                    found: foundEvents.includes(name),
                })),
                requiredState: [],
            },
        };
        // Add recommendations if not compliant
        if (!result.compliant) {
            result.recommendations.push("Implement all required ERC721 functions and events to ensure NFT standard compatibility.");
            if (!foundFunctions.includes("safeTransferFrom")) {
                result.recommendations.push("The safeTransferFrom function is critical to prevent NFTs from being locked in contracts that cannot handle them.");
            }
        }
        return result;
    }
    /**
     * Run all compliance checks
     */
    checkAllCompliance() {
        return {
            erc20: this.checkERC20Compliance(),
            erc721: this.checkERC721Compliance(),
            // Add more standards as needed
        };
    }
}
exports.ComplianceChecker = ComplianceChecker;
// Example usage:
// const checker = new ComplianceChecker(contractSourceCode);
// const erc20Result = checker.checkERC20Compliance();
// console.log(erc20Result);
