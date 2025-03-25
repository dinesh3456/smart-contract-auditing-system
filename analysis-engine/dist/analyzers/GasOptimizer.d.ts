export interface GasIssue {
    id: string;
    description: string;
    location: {
        line: number;
        column?: number;
        file?: string;
    };
    gasSaved: string;
    recommendation: string;
}
export declare class GasOptimizer {
    private sourceCode;
    private fileName;
    private ast;
    private gasIssues;
    constructor(sourceCode: string, fileName?: string);
    /**
     * Run all gas optimization checks
     */
    analyze(): GasIssue[];
    /**
     * Direct pattern matching for multiple state variable reads
     */
    private detectMultipleStateReads;
    /**
     * Direct pattern matching for loop optimization opportunities
     */
    private detectLoopOptimizations;
    /**
     * Direct pattern matching for calldata vs memory optimization opportunities
     */
    private detectCalldataVsMemory;
}
