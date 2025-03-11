import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";
import { ComplianceResult, ERC20Checker } from "./ERC20Checker";

export class ERC721Checker {
  private sourceCode: string;
  private ast: ASTNode;

  constructor(sourceCode: string) {
    this.sourceCode = sourceCode;
    try {
      this.ast = parser.parse(sourceCode, { loc: true });
    } catch (error) {
      throw new Error(`Failed to parse contract: ${error}`);
    }
  }

  /**
   * Check if the contract is ERC721 compliant
   */
  public checkCompliance(): ComplianceResult {
    // Required functions for ERC721
    const requiredFunctions = [
      {
        name: "balanceOf",
        signature:
          "function balanceOf(address owner) external view returns (uint256)",
        purpose: "Returns the number of NFTs owned by an address",
      },
      {
        name: "ownerOf",
        signature:
          "function ownerOf(uint256 tokenId) external view returns (address)",
        purpose: "Returns the owner of a specific NFT",
      },
      {
        name: "safeTransferFrom",
        signature:
          "function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external",
        purpose:
          "Safely transfers the ownership of a given token ID to another address with data parameter",
      },
      {
        name: "safeTransferFrom",
        signature:
          "function safeTransferFrom(address from, address to, uint256 tokenId) external",
        purpose:
          "Safely transfers the ownership of a given token ID to another address",
      },
      {
        name: "transferFrom",
        signature:
          "function transferFrom(address from, address to, uint256 tokenId) external",
        purpose:
          "Transfers the ownership of a given token ID to another address",
      },
      {
        name: "approve",
        signature: "function approve(address to, uint256 tokenId) external",
        purpose: "Gives permission to transfer an NFT to another account",
      },
      {
        name: "getApproved",
        signature:
          "function getApproved(uint256 tokenId) external view returns (address)",
        purpose: "Gets the approved address for a token ID",
      },
      {
        name: "setApprovalForAll",
        signature:
          "function setApprovalForAll(address operator, bool approved) external",
        purpose: "Approves or removes operator for all tokens for the caller",
      },
      {
        name: "isApprovedForAll",
        signature:
          "function isApprovedForAll(address owner, address operator) external view returns (bool)",
        purpose: "Tells whether an operator is approved by an owner",
      },
    ];

    // Required events for ERC721
    const requiredEvents = [
      {
        name: "Transfer",
        signature:
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        purpose: "Emitted when tokenId is transferred from from to to",
      },
      {
        name: "Approval",
        signature:
          "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
        purpose: "Emitted when owner approves tokenId to approved",
      },
      {
        name: "ApprovalForAll",
        signature:
          "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
        purpose:
          "Emitted when owner enables or disables operator for all tokens",
      },
    ];

    // Optional interface functions (ERC721Metadata and ERC721Enumerable)
    const optionalFunctions = [
      {
        name: "name",
        signature: "function name() external view returns (string memory)",
        purpose: "Gets the token collection name (ERC721Metadata)",
      },
      {
        name: "symbol",
        signature: "function symbol() external view returns (string memory)",
        purpose: "Gets the token collection symbol (ERC721Metadata)",
      },
      {
        name: "tokenURI",
        signature:
          "function tokenURI(uint256 tokenId) external view returns (string memory)",
        purpose: "Gets the URI for a token ID (ERC721Metadata)",
      },
      {
        name: "totalSupply",
        signature: "function totalSupply() external view returns (uint256)",
        purpose: "Gets the total amount of tokens (ERC721Enumerable)",
      },
      {
        name: "tokenByIndex",
        signature:
          "function tokenByIndex(uint256 index) external view returns (uint256)",
        purpose: "Gets a token ID at a given index (ERC721Enumerable)",
      },
      {
        name: "tokenOfOwnerByIndex",
        signature:
          "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
        purpose:
          "Gets a token ID at a given index of the owned tokens list (ERC721Enumerable)",
      },
    ];

    // Check for ERC721 interface implementation
    let implementsERC721Interface = false;

    parser.visit(this.ast, {
      ImportDirective: (node) => {
        if (node.path.includes("ERC721") || node.path.includes("IERC721")) {
          implementsERC721Interface = true;
        }
      },
      ContractDefinition: (node) => {
        if (node.baseContracts) {
          for (const base of node.baseContracts) {
            if (
              base.baseName.namePath.includes("ERC721") ||
              base.baseName.namePath.includes("IERC721")
            ) {
              implementsERC721Interface = true;
            }
          }
        }
      },
    });

    // Find implemented functions
    const foundFunctions = this.findImplementedFunctions(
      requiredFunctions.map((f) => f.name)
    );

    // Find implemented events
    const foundEvents = this.findImplementedEvents(
      requiredEvents.map((e) => e.name)
    );

    // Find implemented optional functions
    const foundOptionalFunctions = this.findImplementedFunctions(
      optionalFunctions.map((f) => f.name)
    );

    // Determine missing requirements
    const missingFunctions = requiredFunctions.filter(
      (f) => !this.isFunctionImplemented(f.name, foundFunctions)
    );
    const missingEvents = requiredEvents.filter(
      (e) => !foundEvents.includes(e.name)
    );

    const missingRequirements = [
      ...missingFunctions.map(
        (f) => `Missing function: ${f.name} - ${f.purpose}`
      ),
      ...missingEvents.map((e) => `Missing event: ${e.name} - ${e.purpose}`),
    ];

    // Generate recommendations
    const recommendations: string[] = [];

    if (missingFunctions.length > 0 || missingEvents.length > 0) {
      if (implementsERC721Interface) {
        recommendations.push(
          "Your contract imports or inherits from ERC721, but does not implement all required functions or events."
        );
      } else {
        recommendations.push(
          "Consider inheriting from the OpenZeppelin ERC721 implementation to ensure full compliance."
        );
      }

      if (missingEvents.length > 0) {
        recommendations.push(
          "Always emit appropriate events (Transfer, Approval, ApprovalForAll) when state changes."
        );
      }
    }

    // Check for NFT security best practices
    const securityIssues = this.checkSecurityIssues();
    recommendations.push(...securityIssues);

    // Check for optional interface implementations
    const hasMetadata =
      foundOptionalFunctions.includes("name") &&
      foundOptionalFunctions.includes("symbol") &&
      foundOptionalFunctions.includes("tokenURI");

    const hasEnumerable =
      foundOptionalFunctions.includes("totalSupply") &&
      foundOptionalFunctions.includes("tokenByIndex") &&
      foundOptionalFunctions.includes("tokenOfOwnerByIndex");

    if (!hasMetadata) {
      recommendations.push(
        "Consider implementing ERC721Metadata interface (name, symbol, tokenURI) for better NFT compatibility."
      );
    }

    if (!hasEnumerable) {
      recommendations.push(
        "Consider implementing ERC721Enumerable interface for better marketplace and indexer support."
      );
    }

    // Build the compliance result
    const result: ComplianceResult = {
      standard: "ERC721",
      compliant: missingFunctions.length === 0 && missingEvents.length === 0,
      missingRequirements,
      recommendations,
      details: {
        requiredFunctions: requiredFunctions.map((f) => ({
          name: f.name,
          found: this.isFunctionImplemented(f.name, foundFunctions),
          details: f.signature,
        })),
        requiredEvents: requiredEvents.map((e) => ({
          name: e.name,
          found: foundEvents.includes(e.name),
          details: e.signature,
        })),
        requiredState: optionalFunctions.map((f) => ({
          name: f.name,
          found: foundOptionalFunctions.includes(f.name),
          details: f.signature,
        })),
      },
    };

    return result;
  }

  /**
   * Find implemented functions in the contract
   */
  private findImplementedFunctions(requiredFunctions: string[]): string[] {
    const foundFunctions: string[] = [];

    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (node.name && requiredFunctions.includes(node.name)) {
          foundFunctions.push(node.name);
        }
      },
    });

    return foundFunctions;
  }

  /**
   * Check if a function is implemented (accounting for overloaded functions)
   */
  private isFunctionImplemented(
    functionName: string,
    foundFunctions: string[]
  ): boolean {
    // Special case for safeTransferFrom which has two overloads
    if (functionName === "safeTransferFrom") {
      // For simplicity, we just check if the name exists
      // In a real implementation, we'd check parameter counts and types
      return foundFunctions.includes(functionName);
    }

    return foundFunctions.includes(functionName);
  }

  /**
   * Find implemented events in the contract
   */
  private findImplementedEvents(requiredEvents: string[]): string[] {
    const foundEvents: string[] = [];

    parser.visit(this.ast, {
      EventDefinition: (node) => {
        if (node.name && requiredEvents.includes(node.name)) {
          foundEvents.push(node.name);
        }
      },
    });

    return foundEvents;
  }

  /**
   * Check for common ERC721 security issues
   */
  private checkSecurityIssues(): string[] {
    const issues: string[] = [];

    // Check for reentrancy protections in safeTransferFrom
    let hasReentrancyProtection = false;

    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (node.name === "safeTransferFrom") {
          // Look for nonReentrant modifier or similar protections
          if (
            node.modifiers &&
            node.modifiers.some(
              (m) =>
                m.name.toLowerCase().includes("nonreentrant") ||
                m.name.toLowerCase().includes("noreentrancy")
            )
          ) {
            hasReentrancyProtection = true;
          }

          // Or check for reentrancy guards in the function body
          parser.visit(node, {
            ModifierInvocation: (modNode) => {
              if (
                modNode.name.toLowerCase().includes("nonreentrant") ||
                modNode.name.toLowerCase().includes("noreentrancy")
              ) {
                hasReentrancyProtection = true;
              }
            },
          });
        }
      },
    });

    if (!hasReentrancyProtection) {
      issues.push(
        "Consider adding reentrancy protection to safeTransferFrom functions to prevent potential reentrancy attacks."
      );
    }

    // Check for zero address validation
    const hasZeroAddressCheck = this.hasZeroAddressValidation();

    if (!hasZeroAddressCheck) {
      issues.push(
        "Consider adding checks to prevent transfers to the zero address (0x0) to avoid permanent loss of NFTs."
      );
    }

    // Check for tokenURI validation
    let hasTokenExistenceCheck = false;

    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (node.name === "tokenURI" || node.name === "ownerOf") {
          // Look for existence check
          parser.visit(node, {
            FunctionCall: (callNode) => {
              if (
                callNode.expression.type === "Identifier" &&
                callNode.expression.name === "require"
              ) {
                // This is a rough heuristic - in a real implementation, we'd need more context
                hasTokenExistenceCheck = true;
              }
            },
          });
        }
      },
    });

    if (!hasTokenExistenceCheck) {
      issues.push(
        "Ensure tokenURI and ownerOf functions check that the tokenId exists before returning data."
      );
    }

    return issues;
  }

  /**
   * Check if the contract has validation for zero address
   */
  private hasZeroAddressValidation(): boolean {
    let hasCheck = false;

    parser.visit(this.ast, {
      BinaryOperation: (node) => {
        // Look for comparison operations
        if (["==", "!="].includes(node.operator)) {
          let checksZeroAddress = false;

          // Check if one side is a parameter with address type
          let hasAddressParam = false;

          parser.visit(node.left, {
            Identifier: (idNode) => {
              if (this.isLikelyAddressParameter(idNode.name)) {
                hasAddressParam = true;
              }
            },
          });

          if (!hasAddressParam) {
            parser.visit(node.right, {
              Identifier: (idNode) => {
                if (this.isLikelyAddressParameter(idNode.name)) {
                  hasAddressParam = true;
                }
              },
            });
          }

          // Check if comparing to zero address
          let comparesToZero = false;

          parser.visit(node, {
            NumberLiteral: (numNode) => {
              if (numNode.number === "0") {
                comparesToZero = true;
              }
            },
            HexLiteral: (hexNode) => {
              if (hexNode.value.replace(/0x/i, "").replace(/0/g, "") === "") {
                comparesToZero = true;
              }
            },
          });

          if (hasAddressParam && comparesToZero) {
            checksZeroAddress = true;
          }

          hasCheck = hasCheck || checksZeroAddress;
        }
      },
    });

    return hasCheck;
  }

  /**
   * Check if parameter name is likely an address parameter
   */
  private isLikelyAddressParameter(name: string): boolean {
    const addressParams = [
      "address",
      "addr",
      "recipient",
      "to",
      "from",
      "sender",
      "receiver",
      "owner",
      "spender",
      "operator",
    ];
    return addressParams.some((param) =>
      name.toLowerCase().includes(param.toLowerCase())
    );
  }
}

// Update the StandardComplianceChecker to include the ERC721 checker
export class StandardComplianceCheckerWithERC721 {
  private sourceCode: string;

  constructor(sourceCode: string) {
    this.sourceCode = sourceCode;
  }

  /**
   * Check compliance with ERC20 standard
   */
  public checkERC20(): ComplianceResult {
    const checker = new ERC20Checker(this.sourceCode);
    return checker.checkCompliance();
  }

  /**
   * Check compliance with ERC721 standard
   */
  public checkERC721(): ComplianceResult {
    const checker = new ERC721Checker(this.sourceCode);
    return checker.checkCompliance();
  }

  /**
   * Check compliance with all supported standards
   */
  public checkAllStandards(): Record<string, ComplianceResult> {
    return {
      erc20: this.checkERC20(),
      erc721: this.checkERC721(),
      // More standards can be added here as needed
    };
  }
}
