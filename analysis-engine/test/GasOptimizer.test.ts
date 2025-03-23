// test/GasOptimizer.test.ts
import { GasOptimizer } from "../src/analyzers/GasOptimizer";
import { TestUtils } from "./utils/TestUtils";

describe("GasOptimizer", () => {
  it("should detect multiple state variable reads", () => {
    const sourceCode = TestUtils.loadTestContract("GasOptimizations.sol");
    const optimizer = new GasOptimizer(sourceCode);
    const results = optimizer.analyze();

    const multipleReadsIssues = results.filter(
      (issue) => issue.id === "GAS-01"
    );
    expect(multipleReadsIssues.length).toBeGreaterThan(0);
    console.log(
      "Multiple state reads issues:",
      TestUtils.formatResults(multipleReadsIssues)
    );
  });

  it("should detect loop optimization opportunities", () => {
    const sourceCode = TestUtils.loadTestContract("GasOptimizations.sol");
    const optimizer = new GasOptimizer(sourceCode);
    const results = optimizer.analyze();

    const loopIssues = results.filter((issue) => issue.id === "GAS-05");
    expect(loopIssues.length).toBeGreaterThan(0);
  });

  it("should detect calldata vs memory optimization opportunities", () => {
    const sourceCode = TestUtils.loadTestContract("GasOptimizations.sol");
    const optimizer = new GasOptimizer(sourceCode);
    const results = optimizer.analyze();

    const calldataIssues = results.filter((issue) => issue.id === "GAS-03");
    expect(calldataIssues.length).toBeGreaterThan(0);
  });
});
