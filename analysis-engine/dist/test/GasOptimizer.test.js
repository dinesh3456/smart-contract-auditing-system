"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// test/GasOptimizer.test.ts
const GasOptimizer_1 = require("../src/analyzers/GasOptimizer");
const TestUtils_1 = require("./utils/TestUtils");
describe("GasOptimizer", () => {
    it("should detect multiple state variable reads", () => {
        const sourceCode = TestUtils_1.TestUtils.loadTestContract("GasOptimizations.sol");
        const optimizer = new GasOptimizer_1.GasOptimizer(sourceCode);
        const results = optimizer.analyze();
        const multipleReadsIssues = results.filter((issue) => issue.id === "GAS-01");
        expect(multipleReadsIssues.length).toBeGreaterThan(0);
        console.log("Multiple state reads issues:", TestUtils_1.TestUtils.formatResults(multipleReadsIssues));
    });
    it("should detect loop optimization opportunities", () => {
        const sourceCode = TestUtils_1.TestUtils.loadTestContract("GasOptimizations.sol");
        const optimizer = new GasOptimizer_1.GasOptimizer(sourceCode);
        const results = optimizer.analyze();
        const loopIssues = results.filter((issue) => issue.id === "GAS-05");
        expect(loopIssues.length).toBeGreaterThan(0);
    });
    it("should detect calldata vs memory optimization opportunities", () => {
        const sourceCode = TestUtils_1.TestUtils.loadTestContract("GasOptimizations.sol");
        const optimizer = new GasOptimizer_1.GasOptimizer(sourceCode);
        const results = optimizer.analyze();
        const calldataIssues = results.filter((issue) => issue.id === "GAS-03");
        expect(calldataIssues.length).toBeGreaterThan(0);
    });
});
