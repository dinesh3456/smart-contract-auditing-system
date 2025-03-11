import * as parser from "@solidity-parser/parser";
import {
  ASTNode,
  ASTVisitor,
  FunctionDefinition,
  Expression,
  MemberAccess,
  BinaryOperation,
  Identifier,
  FunctionCall,
  Position,
} from "@solidity-parser/parser/dist/src/ast-types";

// Define a type to represent any node with a parent reference
type NodeWithParent = ASTNode & { parent?: NodeWithParent };

// Define custom types for specific nodes
interface CustomFunctionCall extends FunctionCall {
  parent?: NodeWithParent;
}

// Define a custom position type that includes offset
interface PositionWithOffset extends Position {
  offset: number;
}

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

export class SecurityScanner {
  private sourceCode: string;
  private fileName: string;
  private ast: ASTNode;
  private vulnerabilities: VulnerabilityFinding[] = [];

  constructor(sourceCode: string, fileName: string = "contract.sol") {
    this.sourceCode = sourceCode;
    this.fileName = fileName;
    try {
      this.ast = parser.parse(sourceCode, { loc: true });
      // Add parent references to AST nodes
      this.addParentReferences(this.ast as NodeWithParent);
    } catch (error) {
      throw new Error(`Failed to parse contract: ${error}`);
    }
  }

  /**
   * Add parent references to AST nodes
   */
  private addParentReferences(
    node: NodeWithParent,
    parent?: NodeWithParent
  ): void {
    if (parent) {
      node.parent = parent;
    }

    for (const key in node) {
      const value = (node as any)[key];
      if (value && typeof value === "object") {
        if (Array.isArray(value)) {
          value.forEach((item) => {
            if (item && typeof item === "object" && (item as any).type) {
              this.addParentReferences(item as NodeWithParent, node);
            }
          });
        } else if ((value as any).type) {
          this.addParentReferences(value as NodeWithParent, node);
        }
      }
    }
  }

  /**
   * Run all vulnerability checks
   */
  public scan(): VulnerabilityFinding[] {
    this.vulnerabilities = [];

    // Run all vulnerability checks
    this.checkReentrancy();
    this.checkUncheckedExternalCalls();
    this.checkIntegerOverflow();
    this.checkAccessControl();
    this.checkUnsafeMathOperations();
    this.checkUnusedVariables();
    this.checkTxOrigin();
    this.checkSelfDestruct();
    this.checkRandomnessVulnerabilities();
    this.checkDefaultVisibility();
    this.checkLockPragma();

    return this.vulnerabilities;
  }

  /**
   * Check for reentrancy vulnerabilities
   */
  private checkReentrancy(): void {
    let externalCalls: { node: FunctionDefinition; line: number }[] = [];
    let stateChangesAfterCalls: { node: FunctionDefinition; line: number }[] =
      [];

    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        let hasExternalCall = false;
        let lastExternalCallLine = 0;

        // Find external calls in this function
        parser.visit(node, {
          FunctionCall: (callNode) => {
            if (
              callNode.expression &&
              callNode.expression.type === "MemberAccess" &&
              (callNode.expression as MemberAccess).memberName &&
              ["call", "delegatecall", "send", "transfer"].includes(
                (callNode.expression as MemberAccess).memberName
              )
            ) {
              hasExternalCall = true;
              if (callNode.loc) {
                lastExternalCallLine = callNode.loc.start.line;
              }
            }
          },
          // Don't traverse into other functions
          FunctionDefinition: () => false,
        });

        if (hasExternalCall) {
          externalCalls.push({ node, line: lastExternalCallLine });

          // Check for state changes after external calls
          let hasStateChangeAfterCall = false;

          // Create a custom visitor for state changes
          const visitor = {
            // Use the standard "Assignment" type that the parser expects
            Assignment: (assignNode: any) => {
              if (
                assignNode.loc &&
                assignNode.loc.start.line > lastExternalCallLine
              ) {
                hasStateChangeAfterCall = true;
              }
            },
            // Don't traverse into other functions
            FunctionDefinition: () => false,
          };

          parser.visit(node, visitor as any);

          if (hasStateChangeAfterCall) {
            stateChangesAfterCalls.push({ node, line: lastExternalCallLine });
          }
        }
      },
    });

    // Report findings
    for (const { node, line } of stateChangesAfterCalls) {
      this.vulnerabilities.push({
        id: "SWC-107",
        name: "Reentrancy",
        description:
          "The contract changes state after making an external call, which can lead to reentrancy attacks.",
        severity: "High",
        location: {
          line,
          file: this.fileName,
        },
        details: `Function ${
          node.name || "anonymous"
        } makes an external call and then changes state. This can allow an attacker to re-enter the function and execute code multiple times before the state is updated.`,
        recommendation:
          "Follow the checks-effects-interactions pattern: first perform all checks, then make state changes, and finally interact with external contracts or addresses.",
      });
    }
  }

  /**
   * Check for unchecked external calls
   */
  private checkUncheckedExternalCalls(): void {
    parser.visit(this.ast, {
      FunctionCall: (node) => {
        const nodeWithParent = node as CustomFunctionCall;
        if (
          nodeWithParent.expression &&
          nodeWithParent.expression.type === "MemberAccess" &&
          (nodeWithParent.expression as MemberAccess).memberName &&
          ["call", "send"].includes(
            (nodeWithParent.expression as MemberAccess).memberName
          )
        ) {
          // Check if the result is checked
          let isResultChecked = false;

          // Look up the AST to see if this call is part of a condition or assignment
          if (
            nodeWithParent.parent &&
            ((nodeWithParent.parent as any).type === "IfStatement" ||
              (nodeWithParent.parent as any).type === "Assignment" ||
              ((nodeWithParent.parent as any).type === "BinaryOperation" &&
                ["==", "!=", "&&", "||"].includes(
                  (nodeWithParent.parent as any as BinaryOperation).operator
                )))
          ) {
            isResultChecked = true;
          }

          if (!isResultChecked && nodeWithParent.loc) {
            this.vulnerabilities.push({
              id: "SWC-104",
              name: "Unchecked Call Return Value",
              description:
                "The return value of an external call is not checked.",
              severity: "Medium",
              location: {
                line: nodeWithParent.loc.start.line,
                file: this.fileName,
              },
              details:
                "External calls can fail silently. If the return value is not checked, the contract may continue execution even if the call failed.",
              recommendation:
                "Always check the return value of low-level calls like .call() and .send(). Consider using .transfer() which reverts on failure, or use a require statement to check the return value.",
            });
          }
        }
      },
    });
  }

  /**
   * Check for integer overflow/underflow vulnerabilities
   */
  private checkIntegerOverflow(): void {
    // Check for SafeMath usage
    let usesSafeMath = false;

    parser.visit(this.ast, {
      ImportDirective: (node) => {
        if (node.path.includes("SafeMath")) {
          usesSafeMath = true;
        }
      },
    });

    // For UsingForDirective which isn't directly in ASTVisitor
    const customVisitor = {
      UsingForDirective: (node: any) => {
        if (node.libraryName === "SafeMath") {
          usesSafeMath = true;
        }
        return true;
      },
    };

    parser.visit(this.ast, customVisitor as any);

    // Check for vulnerable arithmetic operations
    const vulnerableOperations: { operation: string; line: number }[] = [];

    parser.visit(this.ast, {
      BinaryOperation: (node) => {
        if (["+", "-", "*"].includes(node.operator) && node.loc) {
          vulnerableOperations.push({
            operation: node.operator,
            line: node.loc.start.line,
          });
        }
      },
    });

    // If contract doesn't use SafeMath and has arithmetic operations, report warning
    if (
      !usesSafeMath &&
      vulnerableOperations.length > 0 &&
      !this.isPostSolidity8()
    ) {
      this.vulnerabilities.push({
        id: "SWC-101",
        name: "Integer Overflow and Underflow",
        description:
          "The contract performs arithmetic operations but does not use SafeMath.",
        severity: this.isPostSolidity8() ? "Low" : "High",
        location: {
          line: vulnerableOperations[0].line,
          file: this.fileName,
        },
        details: `The contract contains ${
          vulnerableOperations.length
        } potentially unsafe arithmetic operations (${vulnerableOperations
          .map((op) => op.operation)
          .join(
            ", "
          )}). Integer overflow/underflow can lead to unexpected behavior.`,
        recommendation: this.isPostSolidity8()
          ? "Solidity 0.8.0+ provides built-in overflow checking, but explicit checks or the use of SafeMath is still recommended for clarity and backward compatibility."
          : "Use SafeMath library for all arithmetic operations to prevent overflow/underflow vulnerabilities.",
      });
    }
  }

  /**
   * Check for access control issues
   */
  private checkAccessControl(): void {
    // Look for critical functions without access control
    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        // Check if function has potential critical operations
        const isCriticalFunction = this.isCriticalFunction(node);

        // Check if function has access control
        const hasAccessControl = this.hasAccessControl(node);

        if (isCriticalFunction && !hasAccessControl && node.loc) {
          this.vulnerabilities.push({
            id: "SWC-105",
            name: "Unprotected Access Control",
            description: `Function ${
              node.name || "anonymous"
            } performs critical operations but lacks access control.`,
            severity: "High",
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            details:
              "The function can be called by any address, potentially allowing unauthorized access to critical operations.",
            recommendation:
              "Add appropriate access control modifiers (e.g., onlyOwner, onlyRole) to restrict access to critical functions.",
          });
        }
      },
    });
  }

  /**
   * Check for unsafe math operations
   */
  private checkUnsafeMathOperations(): void {
    parser.visit(this.ast, {
      BinaryOperation: (node) => {
        // Check for division by variable which could be zero
        if (
          node.operator === "/" &&
          node.right.type !== "NumberLiteral" &&
          node.loc
        ) {
          this.vulnerabilities.push({
            id: "SWC-101",
            name: "Division by Variable",
            description:
              "The contract divides by a variable which could potentially be zero.",
            severity: "Medium",
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            details:
              "Division by zero causes a revert. If the divisor is a variable that could be zero, the transaction will fail.",
            recommendation:
              "Add a check to ensure the divisor is never zero before performing the division.",
          });
        }
      },
    });
  }

  /**
   * Check for unused state variables
   */
  private checkUnusedVariables(): void {
    // Collect all state variables
    const stateVariables = new Map<string, { node: any; used: boolean }>();

    parser.visit(this.ast, {
      StateVariableDeclaration: (node) => {
        if (node.variables && node.variables.length > 0) {
          for (const variable of node.variables) {
            if (variable.name) {
              stateVariables.set(variable.name, {
                node: variable,
                used: false,
              });
            }
          }
        }
      },
    });

    // Mark variables as used if they appear in expressions
    parser.visit(this.ast, {
      Identifier: (node) => {
        if (stateVariables.has(node.name)) {
          stateVariables.get(node.name)!.used = true;
        }
      },
    });

    // Report unused variables
    for (const [name, { node, used }] of stateVariables.entries()) {
      if (!used && node.loc) {
        this.vulnerabilities.push({
          id: "SWC-131",
          name: "Unused State Variable",
          description: `State variable '${name}' is never used.`,
          severity: "Informational",
          location: {
            line: node.loc.start.line,
            file: this.fileName,
          },
          details:
            "Unused state variables indicate potential dead code or incomplete implementation. They also waste gas during deployment.",
          recommendation:
            "Remove unused state variables to reduce contract size and gas costs.",
        });
      }
    }
  }

  /**
   * Check for tx.origin usage
   */
  private checkTxOrigin(): void {
    parser.visit(this.ast, {
      MemberAccess: (node) => {
        if (
          node.memberName === "origin" &&
          node.expression.type === "Identifier" &&
          (node.expression as Identifier).name === "tx" &&
          node.loc
        ) {
          this.vulnerabilities.push({
            id: "SWC-115",
            name: "tx.origin Authentication",
            description: "The contract uses tx.origin for authentication.",
            severity: "High",
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            details:
              "Using tx.origin for authentication makes the contract vulnerable to phishing attacks. A malicious contract can trick a user into calling it, and then use the user's authentication to access the victim contract.",
            recommendation:
              "Use msg.sender instead of tx.origin for authentication.",
          });
        }
      },
    });
  }

  /**
   * Check for selfdestruct vulnerabilities
   */
  private checkSelfDestruct(): void {
    parser.visit(this.ast, {
      FunctionCall: (node) => {
        const nodeWithParent = node as CustomFunctionCall;
        if (
          nodeWithParent.expression.type === "Identifier" &&
          (nodeWithParent.expression as Identifier).name === "selfdestruct" &&
          nodeWithParent.loc
        ) {
          // Check if function containing selfdestruct has access control
          let containingFunction: FunctionDefinition | null = null;
          let current: NodeWithParent = nodeWithParent;

          while (current.parent) {
            if ((current.parent as any).type === "FunctionDefinition") {
              containingFunction =
                current.parent as unknown as FunctionDefinition;
              break;
            }
            current = current.parent;
          }

          const hasAccessControl = containingFunction
            ? this.hasAccessControl(containingFunction)
            : false;

          if (!hasAccessControl) {
            this.vulnerabilities.push({
              id: "SWC-106",
              name: "Unprotected Self-Destruct",
              description:
                "The contract contains an unprotected selfdestruct operation.",
              severity: "Critical",
              location: {
                line: nodeWithParent.loc.start.line,
                file: this.fileName,
              },
              details:
                "A selfdestruct call without access control allows anyone to destroy the contract and send its funds to an arbitrary address.",
              recommendation:
                "Add proper access control to functions containing selfdestruct calls, or remove the selfdestruct functionality if it's not necessary.",
            });
          }
        }
      },
    });
  }

  /**
   * Check for randomness vulnerabilities
   */
  private checkRandomnessVulnerabilities(): void {
    parser.visit(this.ast, {
      MemberAccess: (node) => {
        // Check for block.timestamp, blockhash, etc. used for randomness
        if (
          (node.memberName === "timestamp" &&
            node.expression.type === "Identifier" &&
            (node.expression as Identifier).name === "block") ||
          node.memberName === "blockhash" ||
          (node.memberName === "difficulty" &&
            node.expression.type === "Identifier" &&
            (node.expression as Identifier).name === "block") ||
          (node.memberName === "number" &&
            node.expression.type === "Identifier" &&
            (node.expression as Identifier).name === "block")
        ) {
          // Check context to see if it's likely used for randomness
          let isUsedForRandom = false;
          let current: any = node;

          while (current.parent) {
            if (
              current.parent.type === "VariableDeclaration" &&
              current.parent.name &&
              (current.parent.name.includes("random") ||
                current.parent.name.includes("rand"))
            ) {
              isUsedForRandom = true;
              break;
            }

            if (
              current.parent.type === "BinaryOperation" &&
              current.parent.operator === "%"
            ) {
              isUsedForRandom = true;
              break;
            }

            current = current.parent;
          }

          if (isUsedForRandom && node.loc) {
            const exprName =
              node.expression.type === "Identifier"
                ? (node.expression as Identifier).name
                : "unknown";

            this.vulnerabilities.push({
              id: "SWC-120",
              name: "Weak Sources of Randomness",
              description: `The contract uses ${exprName}.${node.memberName} as a source of randomness.`,
              severity: "Medium",
              location: {
                line: node.loc.start.line,
                file: this.fileName,
              },
              details:
                "Blockchain values like block.timestamp and blockhash are predictable and can be manipulated by miners. They should not be used as a source of randomness.",
              recommendation:
                "Use a secure source of randomness such as Chainlink VRF or commit-reveal schemes.",
            });
          }
        }
      },
    });
  }

  /**
   * Check for functions with default visibility
   */
  private checkDefaultVisibility(): void {
    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (!node.visibility && node.loc) {
          this.vulnerabilities.push({
            id: "SWC-100",
            name: "Function Default Visibility",
            description: `Function ${
              node.name || "anonymous"
            } has default visibility.`,
            severity: "Medium",
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            details:
              "Functions without an explicit visibility specifier are public by default. This may allow unintended access to functions that should be private or internal.",
            recommendation:
              "Always explicitly define visibility for all functions (public, external, internal, or private).",
          });
        }
      },
    });
  }

  /**
   * Check for unlocked pragma
   */
  private checkLockPragma(): void {
    parser.visit(this.ast, {
      PragmaDirective: (node) => {
        if (node.name === "solidity" && node.loc) {
          // Cast to position type with offset
          const locWithOffset = node.loc as unknown as {
            start: PositionWithOffset;
            end: PositionWithOffset;
          };

          const pragmaValue = this.sourceCode.substring(
            locWithOffset.start.offset,
            locWithOffset.end.offset
          );

          if (
            pragmaValue.includes("^") ||
            pragmaValue.includes(">") ||
            pragmaValue.includes("<")
          ) {
            this.vulnerabilities.push({
              id: "SWC-103",
              name: "Floating Pragma",
              description: "The contract uses a floating pragma version.",
              severity: "Low",
              location: {
                line: node.loc.start.line,
                file: this.fileName,
              },
              details:
                "A floating pragma (e.g., ^0.8.0) allows the contract to be compiled with different compiler versions, which may have different security implications.",
              recommendation:
                "Lock the pragma to a specific version (e.g., pragma solidity 0.8.17;) for consistent compilation behavior.",
            });
          }
        }
      },
    });
  }

  /* Helper methods for the analyzers */

  /**
   * Check if the contract uses Solidity 0.8.0 or later
   */
  private isPostSolidity8(): boolean {
    let result = false;

    parser.visit(this.ast, {
      PragmaDirective: (node) => {
        if (node.name === "solidity") {
          const version = node.value.replace("^", "").replace(">=", "").trim();
          const versionNumber = parseFloat(version);
          if (versionNumber >= 0.8) {
            result = true;
          }
        }
      },
    });

    return result;
  }

  /**
   * Check if a function is critical (e.g., it performs sensitive operations)
   */
  private isCriticalFunction(node: FunctionDefinition): boolean {
    const criticalNames = [
      "transfer",
      "send",
      "withdraw",
      "selfdestruct",
      "delegatecall",
      "mint",
      "burn",
      "approve",
      "transferFrom",
      "upgradeProxy",
      "owner",
      "setOwner",
      "admin",
      "setAdmin",
      "pause",
      "unpause",
    ];

    if (
      node.name &&
      criticalNames.some((name) => node.name!.toLowerCase().includes(name))
    ) {
      return true;
    }

    // Check function body for critical operations
    let hasCriticalOperations = false;

    parser.visit(node, {
      FunctionCall: (callNode) => {
        if (
          callNode.expression.type === "MemberAccess" &&
          (callNode.expression as MemberAccess).memberName &&
          criticalNames.includes(
            (callNode.expression as MemberAccess).memberName
          )
        ) {
          hasCriticalOperations = true;
        }

        if (
          callNode.expression.type === "Identifier" &&
          criticalNames.includes((callNode.expression as Identifier).name)
        ) {
          hasCriticalOperations = true;
        }
      },
      // Don't traverse into other functions
      FunctionDefinition: () => false,
    });

    return hasCriticalOperations;
  }

  /**
   * Check if a function has access control (modifiers, require statements with auth checks)
   */
  private hasAccessControl(node: FunctionDefinition): boolean {
    // Check for modifiers that imply access control
    const accessControlModifiers = [
      "onlyOwner",
      "onlyAdmin",
      "onlyRole",
      "authorized",
      "onlyAuth",
      "ownerOnly",
      "adminOnly",
      "only",
      "auth",
    ];

    if (
      node.modifiers &&
      node.modifiers.some((mod) =>
        accessControlModifiers.some((acm) => mod.name.includes(acm))
      )
    ) {
      return true;
    }

    // Check for require/if statements with msg.sender checks
    let hasAccessChecks = false;

    parser.visit(node, {
      FunctionCall: (callNode) => {
        if (
          callNode.expression.type === "Identifier" &&
          (callNode.expression as Identifier).name === "require" &&
          callNode.arguments &&
          callNode.arguments.length > 0
        ) {
          const requireCondition = callNode.arguments[0];
          if (this.containsMsgSenderCheck(requireCondition)) {
            hasAccessChecks = true;
          }
        }
      },
      IfStatement: (ifNode) => {
        if (this.containsMsgSenderCheck(ifNode.condition)) {
          hasAccessChecks = true;
        }
      },
      // Don't traverse into other functions
      FunctionDefinition: () => false,
    });

    return hasAccessChecks;
  }

  /**
   * Check if an expression contains a msg.sender comparison
   */
  private containsMsgSenderCheck(node: any): boolean {
    let hasMsgSenderCheck = false;

    parser.visit(node, {
      BinaryOperation: (binNode) => {
        if (["==", "!=", "<=", ">=", "<", ">"].includes(binNode.operator)) {
          const hasOwnerCheck = this.nodeIncludesString(binNode, "owner");
          const hasAdminCheck = this.nodeIncludesString(binNode, "admin");
          const hasMsgSender = this.nodeIncludesMsgSender(binNode);

          if ((hasOwnerCheck || hasAdminCheck) && hasMsgSender) {
            hasMsgSenderCheck = true;
          }
        }
      },
    });

    return hasMsgSenderCheck;
  }

  /**
   * Check if a node includes a specific string
   */
  private nodeIncludesString(node: any, str: string): boolean {
    let includes = false;

    parser.visit(node, {
      Identifier: (idNode) => {
        if (idNode.name.toLowerCase().includes(str.toLowerCase())) {
          includes = true;
        }
      },
    });

    return includes;
  }

  /**
   * Check if a node includes msg.sender
   */
  private nodeIncludesMsgSender(node: any): boolean {
    let includesMsgSender = false;

    parser.visit(node, {
      MemberAccess: (maNode) => {
        if (
          maNode.memberName === "sender" &&
          maNode.expression.type === "Identifier" &&
          (maNode.expression as Identifier).name === "msg"
        ) {
          includesMsgSender = true;
        }
      },
    });

    return includesMsgSender;
  }
}
