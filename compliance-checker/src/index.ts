import * as parser from "@solidity-parser/parser";
import { ERC20Checker } from "./standards/ERC20Checker";
import { ERC721Checker } from "./standards/ERC721Checker";

export interface ComplianceResult {
  standard: string;
  compliant: boolean;
  missingRequirements: string[];
  recommendations: string[];
  details: {
    requiredFunctions: {
      name: string;
      found: boolean;
      details?: string;
    }[];
    requiredEvents: {
      name: string;
      found: boolean;
      details?: string;
    }[];
    requiredState: {
      name: string;
      found: boolean;
      details?: string;
    }[];
  };
}

export class ComplianceChecker {
  private sourceCode: string;

  constructor(sourceCode: string) {
    this.sourceCode = sourceCode;
  }

  /**
   * Parse the contract to an AST
   */
  private parseContract() {
    try {
      return parser.parse(this.sourceCode, { loc: true });
    } catch (error) {
      console.error("Error parsing contract:", error);
      throw error;
    }
  }

  /**
   * Check if the contract is ERC20 compliant
   */
  public checkERC20Compliance(): ComplianceResult {
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
    const foundFunctions: string[] = [];
    const foundEvents: string[] = [];

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
    const missingFunctions = requiredFunctions.filter(
      (f) => !foundFunctions.includes(f)
    );
    const missingEvents = requiredEvents.filter(
      (e) => !foundEvents.includes(e)
    );

    // Build result
    const result: ComplianceResult = {
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
      result.recommendations.push(
        "Implement all required ERC20 functions and events to ensure compatibility."
      );

      if (missingEvents.length > 0) {
        result.recommendations.push(
          "Events are crucial for off-chain applications to track token transfers and approvals."
        );
      }
    }

    return result;
  }

  /**
   * Check if the contract is ERC721 (NFT) compliant
   */
  public checkERC721Compliance(): ComplianceResult {
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
    const foundFunctions: string[] = [];
    const foundEvents: string[] = [];

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
    const missingFunctions = requiredFunctions.filter(
      (f) => !foundFunctions.includes(f)
    );
    const missingEvents = requiredEvents.filter(
      (e) => !foundEvents.includes(e)
    );

    // Build result
    const result: ComplianceResult = {
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
      result.recommendations.push(
        "Implement all required ERC721 functions and events to ensure NFT standard compatibility."
      );

      if (!foundFunctions.includes("safeTransferFrom")) {
        result.recommendations.push(
          "The safeTransferFrom function is critical to prevent NFTs from being locked in contracts that cannot handle them."
        );
      }
    }

    return result;
  }

  /**
   * Run all compliance checks
   */
  public checkAllCompliance(): Record<string, ComplianceResult> {
    return {
      erc20: this.checkERC20Compliance(),
      erc721: this.checkERC721Compliance(),
      // Add more standards as needed
    };
  }
}

export { ERC20Checker, ERC721Checker };

// Example usage:
// const checker = new ComplianceChecker(contractSourceCode);
// const erc20Result = checker.checkERC20Compliance();
// console.log(erc20Result);
