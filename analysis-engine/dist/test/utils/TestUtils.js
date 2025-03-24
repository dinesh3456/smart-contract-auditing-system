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
exports.TestUtils = void 0;
// test/utils/TestUtils.ts
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class TestUtils {
    /**
     * Load a test contract from the test contracts directory
     */
    static loadTestContract(fileName) {
        // Use path.resolve to get absolute path
        const testDir = path.resolve(__dirname, ".."); // Go up one level from utils
        const filePath = path.join(testDir, "contracts", fileName);
        try {
            console.log(`Loading file from: ${filePath}`);
            return fs.readFileSync(filePath, "utf8");
        }
        catch (error) {
            console.error(`Error loading test contract ${fileName} from ${filePath}:`, error);
            throw error;
        }
    }
    /**
     * Format results for display
     */
    static formatResults(results) {
        return JSON.stringify(results, null, 2);
    }
}
exports.TestUtils = TestUtils;
