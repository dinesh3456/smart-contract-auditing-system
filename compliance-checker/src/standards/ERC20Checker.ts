import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

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

export class ERC20Checker {
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
   * Check if the contract is ERC20 compliant
   */
  public checkCompliance(): ComplianceResult {
    // Required functions for ERC20
    const requiredFunctions = [
      {
        name: "totalSupply",
        signature: "function totalSupply() external view returns (uint256)",
        purpose: "Returns the total token supply",
      },
      {
        name: "balanceOf",
        signature:
          "function balanceOf(address account) external view returns (uint256)",
        purpose: "Returns the account balance of an account",
      },
      {
        name: "transfer",
        signature:
          "function transfer(address recipient, uint256 amount) external returns (bool)",
        purpose: "Transfers tokens from sender to recipient",
      },
      {
        name: "allowance",
        signature:
          "function allowance(address owner, address spender) external view returns (uint256)",
        purpose:
          "Returns the amount of tokens the spender is allowed to spend on behalf of the owner",
      },
      {
        name: "approve",
        signature:
          "function approve(address spender, uint256 amount) external returns (bool)",
        purpose:
          "Sets the amount of tokens the spender is allowed to transfer on behalf of the owner",
      },
      {
        name: "transferFrom",
        signature:
          "function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)",
        purpose:
          "Transfers tokens from sender to recipient using the allowance mechanism",
      },
    ];

    // Required events for ERC20
    const requiredEvents = [
      {
        name: "Transfer",
        signature:
          "event Transfer(address indexed from, address indexed to, uint256 value)",
        purpose:
          "Must be emitted when tokens are transferred, including zero value transfers",
      },
      {
        name: "Approval",
        signature:
          "event Approval(address indexed owner, address indexed spender, uint256 value)",
        purpose: "Must be emitted when approval is set or changed",
      },
    ];

    // Required state variables (not strictly required by ERC20, but common practice)
    const requiredState = [
      {
        name: "name",
        type: "string",
        purpose: "Name of the token (optional in ERC20 but required in EIP-20)",
      },
      {
        name: "symbol",
        type: "string",
        purpose:
          "Symbol of the token (optional in ERC20 but required in EIP-20)",
      },
      {
        name: "decimals",
        type: "uint8",
        purpose:
          "Number of decimals (optional in ERC20 but required in EIP-20)",
      },
    ];

    // Check for ERC20 interface implementation
    let implementsERC20Interface = false;

    parser.visit(this.ast, {
      ImportDirective: (node) => {
        if (node.path.includes("ERC20") || node.path.includes("IERC20")) {
          implementsERC20Interface = true;
        }
      },
      ContractDefinition: (node) => {
        if (node.baseContracts) {
          for (const base of node.baseContracts) {
            if (
              base.baseName.namePath.includes("ERC20") ||
              base.baseName.namePath.includes("IERC20")
            ) {
              implementsERC20Interface = true;
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

    // Find state variables
    const foundState = this.findImplementedState(
      requiredState.map((s) => s.name)
    );

    // Determine missing requirements
    const missingFunctions = requiredFunctions.filter(
      (f) => !foundFunctions.includes(f.name)
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
      if (implementsERC20Interface) {
        recommendations.push(
          "Your contract imports or inherits from ERC20, but does not implement all required functions or events."
        );
      } else {
        recommendations.push(
          "Consider inheriting from the OpenZeppelin ERC20 implementation to ensure full compliance."
        );
      }

      if (missingEvents.length > 0) {
        recommendations.push(
          "Always emit Transfer and Approval events when token balances or allowances change."
        );
      }
    }

    // Check for common implementation issues
    const implementationIssues = this.checkImplementationIssues();
    recommendations.push(...implementationIssues);

    // Build the compliance result
    const result: ComplianceResult = {
      standard: "ERC20",
      compliant: missingFunctions.length === 0 && missingEvents.length === 0,
      missingRequirements,
      recommendations,
      details: {
        requiredFunctions: requiredFunctions.map((f) => ({
          name: f.name,
          found: foundFunctions.includes(f.name),
          details: f.signature,
        })),
        requiredEvents: requiredEvents.map((e) => ({
          name: e.name,
          found: foundEvents.includes(e.name),
          details: e.signature,
        })),
        requiredState: requiredState.map((s) => ({
          name: s.name,
          found: foundState.includes(s.name),
          details: `${s.type} ${s.name}`,
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
   * Find implemented state variables in the contract
   */
  private findImplementedState(requiredState: string[]): string[] {
    const foundState: string[] = [];

    parser.visit(this.ast, {
      StateVariableDeclaration: (node) => {
        if (node.variables) {
          for (const variable of node.variables) {
            if (variable.name && requiredState.includes(variable.name)) {
              foundState.push(variable.name);
            }
          }
        }
      },
    });

    return foundState;
  }

  /**
   * Check for common ERC20 implementation issues
   */
  private checkImplementationIssues(): string[] {
    const issues: string[] = [];

    // Check for return values in transfer and approve functions
    let transferHasReturn = false;
    let approveHasReturn = false;
    let transferFromHasReturn = false;

    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (node.name === "transfer") {
          transferHasReturn = this.functionHasReturnValue(node, "bool");
        } else if (node.name === "approve") {
          approveHasReturn = this.functionHasReturnValue(node, "bool");
        } else if (node.name === "transferFrom") {
          transferFromHasReturn = this.functionHasReturnValue(node, "bool");
        }
      },
    });

    if (!transferHasReturn) {
      issues.push(
        "The transfer function should return a boolean value to indicate success or failure."
      );
    }

    if (!approveHasReturn) {
      issues.push(
        "The approve function should return a boolean value to indicate success or failure."
      );
    }

    if (!transferFromHasReturn) {
      issues.push(
        "The transferFrom function should return a boolean value to indicate success or failure."
      );
    }

    // Check for Transfer event emission in transfer function
    let transferEmitsEvent = false;

    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (node.name === "transfer") {
          transferEmitsEvent = this.functionEmitsEvent(node, "Transfer");
        }
      },
    });

    if (!transferEmitsEvent) {
      issues.push("The transfer function should emit the Transfer event.");
    }

    // Check for zero address validation
    const hasZeroAddressCheck = this.hasZeroAddressValidation();

    if (!hasZeroAddressCheck) {
      issues.push(
        "Consider adding checks to prevent transfers to the zero address (0x0)."
      );
    }

    return issues;
  }

  /**
   * Check if a function has a return value of the expected type
   */
  private functionHasReturnValue(node: any, expectedType: string): boolean {
    if (!node.returnParameters || node.returnParameters.length === 0) {
      return false;
    }

    return node.returnParameters.some((param: any) => {
      if (param.typeName && param.typeName.name) {
        return param.typeName.name.toLowerCase() === expectedType.toLowerCase();
      }
      return false;
    });
  }

  /**
   * Check if a function emits a specific event
   */
  private functionEmitsEvent(node: any, eventName: string): boolean {
    let emitsEvent = false;

    parser.visit(node, {
      EmitStatement: (emitNode) => {
        if (
          emitNode.eventCall &&
          emitNode.eventCall.expression &&
          "name" in emitNode.eventCall.expression &&
          emitNode.eventCall.expression.name === eventName
        ) {
          emitsEvent = true;
        }
      },
      // Don't traverse into other functions
      FunctionDefinition: () => false,
    });

    return emitsEvent;
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
    ];
    return addressParams.some((param) =>
      name.toLowerCase().includes(param.toLowerCase())
    );
  }
}

// Create a factory for multiple standard checkers
export class StandardComplianceChecker {
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
    // This would be implemented similar to ERC20 checker
    // For now, return a placeholder
    return {
      standard: "ERC721",
      compliant: false,
      missingRequirements: ["ERC721 checker not fully implemented yet"],
      recommendations: [
        "Implement ERC721 standard through OpenZeppelin library",
      ],
      details: {
        requiredFunctions: [],
        requiredEvents: [],
        requiredState: [],
      },
    };
  }

  /**
   * Check compliance with all supported standards
   */
  public checkAllStandards(): Record<string, ComplianceResult> {
    return {
      erc20: this.checkERC20(),
      erc721: this.checkERC721(),
      // More standards can be added here
    };
  }
}
