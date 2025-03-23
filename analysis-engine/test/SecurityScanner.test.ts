// test/SecurityScanner.test.ts
import { SecurityScanner } from "../src/analyzers/SecurityScanner";
import { TestUtils } from "./utils/TestUtils";

describe("SecurityScanner", () => {
  it("should detect reentrancy vulnerabilities", () => {
    const sourceCode = TestUtils.loadTestContract("Reentrancy.sol");
    console.log("Contract code:", sourceCode.substring(0, 200) + "...");
    const scanner = new SecurityScanner(sourceCode);
    const results = scanner.scan();

    // Find reentrancy issues
    const reentrancyIssues = results.filter((issue) => issue.id === "SWC-107");

    expect(reentrancyIssues.length).toBeGreaterThan(0);
    console.log(
      "Reentrancy issues:",
      TestUtils.formatResults(reentrancyIssues)
    );
  });

  it("should detect tx.origin vulnerabilities", () => {
    const sourceCode = `
      contract TxOriginVulnerable {
        address owner;
        
        constructor() {
            owner = msg.sender;
        }
        
        function transferOwnership(address newOwner) public {
            if (tx.origin == owner) {
                owner = newOwner;
            }
        }
      }
    `;

    const scanner = new SecurityScanner(sourceCode);
    const results = scanner.scan();

    const txOriginIssues = results.filter((issue) => issue.id === "SWC-115");
    expect(txOriginIssues.length).toBeGreaterThan(0);
  });
});
