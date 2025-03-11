import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

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

// Define custom node types to add the parent property
type NodeWithParent = ASTNode & { parent?: NodeWithParent };

export class GasOptimizer {
  private sourceCode: string;
  private fileName: string;
  private ast: ASTNode;
  private gasIssues: GasIssue[] = [];

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
   * Run all gas optimization checks
   */
  public analyze(): GasIssue[] {
    this.gasIssues = [];

    // Run all gas optimization checks
    this.checkStoragePatterns();
    this.checkUnusedStateVars();
    this.checkCallDataVsMemory();
    this.checkUnnecessaryPublicFunctions();
    this.checkLoopOptimizations();
    this.checkPackedStructs();
    this.checkViewPureKeywords();
    this.checkShortCircuitRules();
    this.checkStringLengths();
    this.checkConstantsVsImmutables();

    return this.gasIssues;
  }

  /**
   * Check storage access patterns that cost extra gas
   */
  private checkStoragePatterns(): void {
    // Check for multiple reads from the same storage variable
    const functionStorageReads = new Map<string, Map<string, number>>();

    // First pass: collect all storage reads per function
    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (!node.name) return;

        const storageReads = new Map<string, number>();
        functionStorageReads.set(node.name, storageReads);

        parser.visit(node, {
          Identifier: (idNode) => {
            // We're looking for state variable reads, so check parent nodes
            const nodeWithParent = idNode as unknown as NodeWithParent;
            if (
              nodeWithParent.parent &&
              (nodeWithParent.parent as any).type !== "VariableDeclaration" &&
              (nodeWithParent.parent as any).type !== "StateVariableDeclaration"
            ) {
              // This is a rough heuristic - we'd need full type information to be precise
              if (!this.isLocalVariable(idNode.name, node)) {
                const currentCount = storageReads.get(idNode.name) || 0;
                storageReads.set(idNode.name, currentCount + 1);
              }
            }
          },
          // Don't traverse into other functions
          FunctionDefinition: () => false,
        });
      },
    });

    // Second pass: report issues for variables read multiple times
    for (const [funcName, storageReads] of functionStorageReads.entries()) {
      for (const [varName, readCount] of storageReads.entries()) {
        if (readCount > 2) {
          // Find the function node to get location
          let funcLine = 0;
          parser.visit(this.ast, {
            FunctionDefinition: (node) => {
              if (node.name === funcName && node.loc) {
                funcLine = node.loc.start.line;
              }
            },
          });

          this.gasIssues.push({
            id: "GAS-01",
            description: `Function '${funcName}' reads state variable '${varName}' multiple times (${readCount} reads)`,
            location: {
              line: funcLine,
              file: this.fileName,
            },
            gasSaved: "Up to 100 gas per operation",
            recommendation: `Cache the state variable '${varName}' in a local variable at the beginning of the function to save gas.`,
          });
        }
      }
    }
  }

  /**
   * Check for unused state variables
   */
  private checkUnusedStateVars(): void {
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
        this.gasIssues.push({
          id: "GAS-02",
          description: `State variable '${name}' is never used`,
          location: {
            line: node.loc.start.line,
            file: this.fileName,
          },
          gasSaved: "Up to 20,000+ gas on deployment",
          recommendation: `Remove unused state variable '${name}' to reduce contract size and deployment cost.`,
        });
      }
    }
  }

  /**
   * Check for functions that could use calldata instead of memory
   */
  private checkCallDataVsMemory(): void {
    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (
          node.visibility === "external" &&
          node.parameters &&
          node.parameters.length > 0
        ) {
          for (const param of node.parameters) {
            if (
              param.typeName &&
              param.typeName.type === "ArrayTypeName" &&
              param.storageLocation === "memory" &&
              param.loc
            ) {
              this.gasIssues.push({
                id: "GAS-03",
                description: `External function '${
                  node.name || "anonymous"
                }' uses 'memory' for array parameter '${param.name}'`,
                location: {
                  line: param.loc.start.line,
                  file: this.fileName,
                },
                gasSaved: "Up to 600+ gas per call",
                recommendation: `Use 'calldata' instead of 'memory' for external function parameters of array or struct type to save gas.`,
              });
            }
          }
        }
      },
    });
  }

  /**
   * Check for internal functions that are unnecessarily public
   */
  private checkUnnecessaryPublicFunctions(): void {
    // First, collect all function calls to track which public functions are called externally
    const publicFunctions = new Map<
      string,
      { node: any; calledExternally: boolean }
    >();

    // Find all public functions
    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (node.name && (node.visibility === "public" || !node.visibility)) {
          publicFunctions.set(node.name, { node, calledExternally: false });
        }
      },
    });

    // Check which functions are called from within the contract
    parser.visit(this.ast, {
      FunctionCall: (node) => {
        if (node.expression && node.expression.type === "Identifier") {
          const functionName = node.expression.name;

          if (publicFunctions.has(functionName)) {
            // Function is called internally
            // Note: This is a simple heuristic. In a real implementation, we would need
            // to check the context to determine if this is truly an internal call.
          }
        }
      },
    });

    // Report public functions that could be internal
    // In a real implementation, we'd need inheritance analysis and more context
    // to determine which functions truly need to be public
    for (const [
      name,
      { node, calledExternally },
    ] of publicFunctions.entries()) {
      // Skip constructor, standard ERC functions, etc.
      if (this.isLikelyRequiredPublic(name)) continue;

      if (!calledExternally && node.loc) {
        this.gasIssues.push({
          id: "GAS-04",
          description: `Function '${name}' is declared public but might be used only internally`,
          location: {
            line: node.loc.start.line,
            file: this.fileName,
          },
          gasSaved: "Up to 400+ gas per deployment",
          recommendation: `If '${name}' is not called from outside the contract, change visibility from 'public' to 'internal' to save gas.`,
        });
      }
    }
  }

  /**
   * Check for loop optimization opportunities
   */
  private checkLoopOptimizations(): void {
    parser.visit(this.ast, {
      ForStatement: (node) => {
        if (!node.loc) return;

        // Check if loop condition reads array length multiple times
        let readsLength = false;
        let cachesLength = false;

        // Check loop condition
        if (node.conditionExpression) {
          parser.visit(node.conditionExpression, {
            MemberAccess: (maNode) => {
              if (maNode.memberName === "length") {
                readsLength = true;
              }
            },
          });
        }

        // Check if there's a local variable caching the length in the initialization
        if (node.initExpression) {
          parser.visit(node.initExpression, {
            VariableDeclaration: (vdNode) => {
              if (vdNode.name && vdNode.name.includes("len")) {
                cachesLength = true;
              }
            },
          });
        }

        if (readsLength && !cachesLength) {
          this.gasIssues.push({
            id: "GAS-05",
            description: "Loop condition reads array length in each iteration",
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            gasSaved: "Up to 100+ gas per loop iteration",
            recommendation:
              "Cache array length in a local variable before the loop to save gas.",
          });
        }

        // Check if loop increments a storage variable
        const customVisitor = {
          BinaryOperation: (binNode: any) => {
            // Check for increment operations
            if (binNode.operator === "+=" || binNode.operator === "++") {
              // This is a simple heuristic - we'd need type information for more accuracy
              // In reality, we'd need to check if the incremented variable is a storage variable
              if (binNode.left && binNode.left.type === "Identifier") {
                this.gasIssues.push({
                  id: "GAS-06",
                  description: "Loop potentially increments a storage variable",
                  location: {
                    line: node.loc!.start.line,
                    file: this.fileName,
                  },
                  gasSaved: "Up to 800+ gas per loop iteration",
                  recommendation:
                    "Use a memory variable for counting in loops and update storage once after the loop.",
                });
              }
            }
          },
        };

        parser.visit(node.loopExpression || {}, customVisitor as any);
      },
    });
  }

  /**
   * Check for struct packing opportunities
   */
  private checkPackedStructs(): void {
    parser.visit(this.ast, {
      StructDefinition: (node) => {
        if (!node.loc) return;

        // Check if struct members could be packed more efficiently
        const typeSizes = new Map<string, number>([
          ["bool", 1],
          ["uint8", 1],
          ["uint16", 2],
          ["uint32", 4],
          ["uint64", 8],
          ["uint128", 16],
          ["uint256", 32],
          ["int8", 1],
          ["int16", 2],
          ["int32", 4],
          ["int64", 8],
          ["int128", 16],
          ["int256", 32],
          ["address", 20],
          ["bytes32", 32],
        ]);

        // Collect member types
        const members: Array<{ name: string; type: string; size: number }> = [];

        if (node.members) {
          for (const member of node.members) {
            if (
              member.typeName &&
              member.typeName.type === "ElementaryTypeName"
            ) {
              const typeName = member.typeName.name;
              const size = typeSizes.get(typeName) || 32; // Default to max size

              members.push({
                name: member.name || "", // Handle potential null values
                type: typeName,
                size,
              });
            }
          }
        }

        // Check if there are packing opportunities
        if (members.length > 1) {
          // Sort by size descending to optimize packing
          const sortedMembers = [...members].sort((a, b) => b.size - a.size);

          // If the order is different, suggest reordering
          const isReordered = members.some(
            (member, i) => member.name !== sortedMembers[i].name
          );

          if (isReordered) {
            this.gasIssues.push({
              id: "GAS-07",
              description: `Struct '${node.name}' fields could be packed more efficiently`,
              location: {
                line: node.loc.start.line,
                file: this.fileName,
              },
              gasSaved: "Up to 2,000+ gas per storage operation",
              recommendation:
                "Reorder struct fields from largest to smallest to optimize storage packing.",
            });
          }
        }
      },
    });
  }

  /**
   * Check for missing view/pure keywords
   */
  private checkViewPureKeywords(): void {
    parser.visit(this.ast, {
      FunctionDefinition: (node) => {
        if (!node.loc || node.isConstructor) return;

        // Skip if already marked as view or pure
        if (node.stateMutability === "view" || node.stateMutability === "pure")
          return;

        // Check if function reads state but doesn't modify it (candidate for 'view')
        let readsState = false;
        let modifiesState = false;

        // Define assignment visitor separately
        const customVisitor = {
          Identifier: (idNode: any) => {
            // This is a heuristic - we'd need full type information to be precise
            if (!this.isLocalVariable(idNode.name, node)) {
              readsState = true;
            }
          },
          Assignment: () => {
            modifiesState = true;
          },
          // Don't traverse into other functions
          FunctionDefinition: () => false,
        };

        parser.visit(node, customVisitor as any);

        if (readsState && !modifiesState && node.name) {
          this.gasIssues.push({
            id: "GAS-08",
            description: `Function '${node.name}' could be marked as 'view'`,
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            gasSaved: "Gas savings for external calls",
            recommendation: `Add the 'view' keyword to function '${node.name}' to enable gas optimizations.`,
          });
        } else if (!readsState && !modifiesState && node.name) {
          this.gasIssues.push({
            id: "GAS-09",
            description: `Function '${node.name}' could be marked as 'pure'`,
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            gasSaved: "Gas savings for external calls",
            recommendation: `Add the 'pure' keyword to function '${node.name}' to enable gas optimizations.`,
          });
        }
      },
    });
  }

  /**
   * Check for short-circuit rule opportunities
   */
  private checkShortCircuitRules(): void {
    parser.visit(this.ast, {
      BinaryOperation: (node) => {
        if (!node.loc) return;

        // Check for '&&' operations that could benefit from short-circuiting
        if (node.operator === "&&") {
          // Check for storage reads in the right side operand
          let rightSideReadsStorage = false;

          parser.visit(node.right, {
            Identifier: (idNode) => {
              // Rough heuristic for state variable reads
              if (!this.isLocalIdentifier(idNode.name)) {
                rightSideReadsStorage = true;
              }
            },
          });

          if (rightSideReadsStorage) {
            this.gasIssues.push({
              id: "GAS-10",
              description:
                "Condition uses && with potential storage read on right side",
              location: {
                line: node.loc.start.line,
                file: this.fileName,
              },
              gasSaved: "Up to 200+ gas in some executions",
              recommendation:
                "Consider rearranging && conditions to perform cheap checks first for short-circuit optimization.",
            });
          }
        }
      },
    });
  }

  /**
   * Check for long string constants
   */
  private checkStringLengths(): void {
    parser.visit(this.ast, {
      StringLiteral: (node) => {
        if (!node.loc) return;

        const value = node.value || "";
        if (value.length > 32) {
          this.gasIssues.push({
            id: "GAS-11",
            description: `String literal exceeds 32 bytes (${value.length} bytes)`,
            location: {
              line: node.loc.start.line,
              file: this.fileName,
            },
            gasSaved: "Up to 500+ gas per deployment",
            recommendation:
              "Consider shortening string literals to fit within 32 bytes or using events for longer messages.",
          });
        }
      },
    });
  }

  /**
   * Check for constants vs immutables
   */
  private checkConstantsVsImmutables(): void {
    parser.visit(this.ast, {
      StateVariableDeclaration: (node) => {
        if (!node.variables || !node.loc) return;

        for (const variable of node.variables) {
          // Check if variable is constant
          if (variable.isDeclaredConst) continue;

          // Check if variable is initialized but not marked as constant or immutable
          if (variable.expression && !variable.isImmutable) {
            // Check if the init value is a literal (good candidate for constant/immutable)
            let isLiteral = false;

            parser.visit(variable.expression, {
              NumberLiteral: () => {
                isLiteral = true;
              },
              StringLiteral: () => {
                isLiteral = true;
              },
              BooleanLiteral: () => {
                isLiteral = true;
              },
            });

            if (isLiteral) {
              this.gasIssues.push({
                id: "GAS-12",
                description: `State variable '${variable.name}' could be declared as 'constant' or 'immutable'`,
                location: {
                  line: node.loc.start.line,
                  file: this.fileName,
                },
                gasSaved: "Up to 10,000+ gas per deployment",
                recommendation: `If '${variable.name}' never changes, declare it as 'constant'. If it's set in the constructor, use 'immutable'.`,
              });
            }
          }
        }
      },
    });
  }

  /* Helper methods */

  /**
   * Check if a variable is likely a local variable in the given function
   */
  private isLocalVariable(name: string, functionNode: any): boolean {
    let isLocal = false;

    // Check parameters
    if (functionNode.parameters) {
      for (const param of functionNode.parameters) {
        if (param.name === name) {
          isLocal = true;
          break;
        }
      }
    }

    // Check local variable declarations
    if (!isLocal) {
      parser.visit(functionNode, {
        VariableDeclaration: (vdNode) => {
          if (vdNode.name === name) {
            isLocal = true;
          }
        },
        // Don't traverse into other functions
        FunctionDefinition: () => false,
      });
    }

    return isLocal;
  }

  /**
   * Check if an identifier is likely a local variable or parameter
   */
  private isLocalIdentifier(name: string): boolean {
    // Common local variable naming patterns
    const localPrefixes = ["_", "local", "temp", "tmp", "i_", "l_"];

    return localPrefixes.some((prefix) => name.startsWith(prefix));
  }

  /**
   * Check if a function name is likely required to be public
   */
  private isLikelyRequiredPublic(name: string): boolean {
    // Common function names that are expected to be public
    const publicFunctionPatterns = [
      "constructor",
      "fallback",
      "receive",
      "totalSupply",
      "balanceOf",
      "transfer",
      "transferFrom",
      "approve",
      "allowance",
      "ownerOf",
      "safeTransferFrom",
      "setApprovalForAll",
      "isApprovedForAll",
      "getApproved",
      "name",
      "symbol",
      "decimals",
      "tokenURI",
    ];

    return publicFunctionPatterns.some(
      (pattern) =>
        name.toLowerCase() === pattern.toLowerCase() ||
        name.toLowerCase().includes(pattern.toLowerCase())
    );
  }
}
