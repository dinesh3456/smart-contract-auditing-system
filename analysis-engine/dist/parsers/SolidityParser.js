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
exports.SolidityParser = void 0;
// src/parsers/SolidityParser.ts
const parser = __importStar(require("@solidity-parser/parser"));
class SolidityParser {
    /**
     * Parse Solidity source code to AST
     */
    static parse(sourceCode) {
        try {
            return parser.parse(sourceCode, { loc: true });
        }
        catch (error) {
            throw new Error(`Failed to parse Solidity code: ${error}`);
        }
    }
    /**
     * Extract contract names from source code
     */
    static extractContractNames(sourceCode) {
        const ast = this.parse(sourceCode);
        const contractNames = [];
        parser.visit(ast, {
            ContractDefinition: (node) => {
                if (node.name) {
                    contractNames.push(node.name);
                }
            },
        });
        return contractNames;
    }
    /**
     * Check if source code is valid Solidity
     */
    static isValidSolidity(sourceCode) {
        try {
            this.parse(sourceCode);
            return true;
        }
        catch (error) {
            return false;
        }
    }
}
exports.SolidityParser = SolidityParser;
