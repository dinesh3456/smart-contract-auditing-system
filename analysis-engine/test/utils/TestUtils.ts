// test/utils/TestUtils.ts
import * as fs from "fs";
import * as path from "path";

export class TestUtils {
  /**
   * Load a test contract from the test contracts directory
   */
  public static loadTestContract(fileName: string): string {
    // Use path.resolve to get absolute path
    const testDir = path.resolve(__dirname, ".."); // Go up one level from utils
    const filePath = path.join(testDir, "contracts", fileName);

    try {
      console.log(`Loading file from: ${filePath}`);
      return fs.readFileSync(filePath, "utf8");
    } catch (error) {
      console.error(
        `Error loading test contract ${fileName} from ${filePath}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Format results for display
   */
  public static formatResults(results: any[]): string {
    return JSON.stringify(results, null, 2);
  }
}
