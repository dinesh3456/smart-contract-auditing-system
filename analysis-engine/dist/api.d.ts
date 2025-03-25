declare const app: any;
interface AnalysisRequest {
    sourceCode: string;
    fileName?: string;
    contractName?: string;
}
interface AnalysisResponse {
    success: boolean;
    contractName: string;
    vulnerabilities: any[];
    gasIssues: any[];
    overallRiskRating: string;
    timestamp: string;
    error?: string;
}
interface ValidationRequest {
    sourceCode: string;
    fileName?: string;
    contractName?: string;
}
interface ValidationResponse {
    success: boolean;
    isValid: boolean;
    message: string;
    error?: string;
}
/**
 * Analyze a smart contract
 */
export declare function analyzeContract(request: AnalysisRequest): Promise<AnalysisResponse>;
/**
 * Validate if a contract is valid Solidity
 */
export declare function validateContract(request: ValidationRequest): ValidationResponse;
export default app;
