// src/utils/CLI.ts
import * as fs from "fs";
import * as path from "path";
import { SecurityScanner } from "../../src/analyzers/SecurityScanner";
import { GasOptimizer } from "../../src/analyzers/GasOptimizer";

export class CLI {
  /**
   * Run the analysis on a file
   */
  public static analyzeFile(filePath: string): void {
    try {
      const fullPath = path.resolve(filePath);
      const sourceCode = fs.readFileSync(fullPath, "utf8");
      const fileName = path.basename(fullPath);

      console.log(`Analyzing ${fileName}...`);

      // Run security scan
      console.log("\nSecurity Scan Results:");
      const securityScanner = new SecurityScanner(sourceCode, fileName);
      const securityResults = securityScanner.scan();

      if (securityResults.length === 0) {
        console.log("No security issues detected.");
      } else {
        console.log(`Found ${securityResults.length} security issues:`);
        securityResults.forEach((issue, index) => {
          console.log(`\n[${index + 1}] ${issue.name} (${issue.severity})`);
          console.log(`   Location: Line ${issue.location.line}`);
          console.log(`   Description: ${issue.description}`);
          console.log(`   Recommendation: ${issue.recommendation}`);
        });
      }

      // Run gas optimization
      console.log("\nGas Optimization Results:");
      const gasOptimizer = new GasOptimizer(sourceCode, fileName);
      const gasResults = gasOptimizer.analyze();

      if (gasResults.length === 0) {
        console.log("No gas optimization opportunities detected.");
      } else {
        console.log(
          `Found ${gasResults.length} gas optimization opportunities:`
        );
        gasResults.forEach((issue, index) => {
          console.log(`\n[${index + 1}] ${issue.description}`);
          console.log(`   Location: Line ${issue.location.line}`);
          console.log(`   Potential Gas Savings: ${issue.gasSaved}`);
          console.log(`   Recommendation: ${issue.recommendation}`);
        });
      }
    } catch (error) {
      console.error("Error analyzing file:", error);
      process.exit(1);
    }
  }
}

// When run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Please provide a Solidity file path to analyze");
    process.exit(1);
  }

  CLI.analyzeFile(args[0]);
}
