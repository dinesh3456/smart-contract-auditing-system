import { SecurityScanner, VulnerabilityFinding } from "./analyzers/SecurityScanner";
import { GasOptimizer } from "./analyzers/GasOptimizer";
export interface AnalysisResult {
    contractName: string;
    sourceCode: string;
    vulnerabilities: Vulnerability[];
    gasIssues: GasIssue[];
    codeQuality: CodeQualityIssue[];
    overallRiskScore: number;
    riskLevel: "Critical" | "High" | "Medium" | "Low" | "Informational";
    compilerVersion?: string;
    compilerWarnings?: CompilerWarning[];
    timestamp: string;
}
export interface Vulnerability {
    id: string;
    name: string;
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
    location: {
        file: string;
        line: number;
        column?: number;
    };
    details: string;
    recommendation: string;
}
export interface GasIssue {
    id: string;
    description: string;
    location: {
        file: string;
        line: number;
        column?: number;
    };
    potential_savings: string;
    recommendation: string;
}
export interface CodeQualityIssue {
    id: string;
    description: string;
    location: {
        file: string;
        line: number;
        column?: number;
    };
    recommendation: string;
}
export interface CompilerWarning {
    message: string;
    type: string;
    severity: "error" | "warning" | "info";
    sourceLocation?: {
        file: string;
        start: number;
        end: number;
    };
}
export interface CompilationResult {
    success: boolean;
    output?: any;
    errors?: CompilerWarning[];
    contractNames?: string[];
}
export declare class SmartContractAnalyzer {
    private sourceCode;
    private contractName;
    private fileName;
    private solcVersion;
    private compilationResult;
    constructor(sourceCode: string, contractName: string, fileName?: string, solcVersion?: string);
    /**
     * Compile the smart contract
     */
    private compile;
    /**
     * Extract contract names from compilation output
     */
    private extractContractNames;
    /**
     * Check if source code is valid Solidity
     */
    isValidSolidity(): boolean;
    /**
     * Run a comprehensive analysis on the smart contract
     */
    analyze(): AnalysisResult;
    /**
     * Detect common vulnerabilities
     */
    private detectVulnerabilities;
    /**
     * Detect gas optimization issues
     */
    private detectGasIssues;
    /**
     * Detect code quality issues
     */
    private detectCodeQualityIssues;
    /**
     * Calculate an overall risk score for the contract
     * Returns a score between 0 (no risk) and 100 (highest risk)
     */
    private calculateRiskScore;
    /**
     * Determine the overall risk level based on the risk score and vulnerabilities
     */
    private determineRiskLevel;
}
export { SecurityScanner, VulnerabilityFinding, GasOptimizer };
export declare function analyzeContract(filePath: string): AnalysisResult;
