import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";
export declare class SolidityParser {
    /**
     * Parse Solidity source code to AST
     */
    static parse(sourceCode: string): ASTNode;
    /**
     * Extract contract names from source code
     */
    static extractContractNames(sourceCode: string): string[];
    /**
     * Check if source code is valid Solidity
     */
    static isValidSolidity(sourceCode: string): boolean;
}
