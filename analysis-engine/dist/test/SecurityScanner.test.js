"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// test/SecurityScanner.test.ts
const SecurityScanner_1 = require("../src/analyzers/SecurityScanner");
const TestUtils_1 = require("./utils/TestUtils");
describe("SecurityScanner", () => {
    it("should detect reentrancy vulnerabilities", () => {
        const sourceCode = TestUtils_1.TestUtils.loadTestContract("Reentrancy.sol");
        console.log("Contract code:", sourceCode.substring(0, 200) + "...");
        const scanner = new SecurityScanner_1.SecurityScanner(sourceCode);
        const results = scanner.scan();
        // Find reentrancy issues
        const reentrancyIssues = results.filter((issue) => issue.id === "SWC-107");
        expect(reentrancyIssues.length).toBeGreaterThan(0);
        console.log("Reentrancy issues:", TestUtils_1.TestUtils.formatResults(reentrancyIssues));
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
        const scanner = new SecurityScanner_1.SecurityScanner(sourceCode);
        const results = scanner.scan();
        const txOriginIssues = results.filter((issue) => issue.id === "SWC-115");
        expect(txOriginIssues.length).toBeGreaterThan(0);
    });
});
