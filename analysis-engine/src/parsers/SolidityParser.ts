// src/parsers/SolidityParser.ts
import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

export class SolidityParser {
  /**
   * Parse Solidity source code to AST
   */
  public static parse(sourceCode: string): ASTNode {
    try {
      return parser.parse(sourceCode, { loc: true });
    } catch (error) {
      throw new Error(`Failed to parse Solidity code: ${error}`);
    }
  }

  /**
   * Extract contract names from source code
   */
  public static extractContractNames(sourceCode: string): string[] {
    const ast = this.parse(sourceCode);
    const contractNames: string[] = [];

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
  public static isValidSolidity(sourceCode: string): boolean {
    try {
      this.parse(sourceCode);
      return true;
    } catch (error) {
      return false;
    }
  }
}
