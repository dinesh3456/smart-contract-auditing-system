export interface VulnerabilityFinding {
    id: string;
    name: string;
    description: string;
    severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
    location: {
        line: number;
        column?: number;
        file?: string;
    };
    details: string;
    recommendation: string;
}
export declare class SecurityScanner {
    private sourceCode;
    private fileName;
    private ast;
    private vulnerabilities;
    constructor(sourceCode: string, fileName?: string);
    /**
     * Run all vulnerability checks
     */
    scan(): VulnerabilityFinding[];
    /**
     * Direct pattern matching for reentrancy vulnerabilities
     */
    private detectReentrancyWithPatternMatching;
    /**
     * Direct pattern matching for tx.origin vulnerabilities
     */
    private detectTxOriginWithPatternMatching;
}
