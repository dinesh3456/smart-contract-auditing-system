// backend/src/workers/analysis.worker.ts
import { analysisQueue } from "../config/queue.config";
import { AnalysisService } from "../services/analysis.service";
import { logger } from "../utils/logger";
import { Analysis } from "../models/analysis.model";
import { Contract } from "../models/contract.model";

const analysisService = new AnalysisService();

// Process analysis jobs
analysisQueue.process("process-analysis", async (job) => {
  const { sourceCode, analysisId, options, contractId } = job.data;

  logger.info(
    `Worker processing analysis job ${job.id} for analysis ${analysisId}`
  );

  try {
    await analysisService.processAnalysis(sourceCode, analysisId, options);
    return { success: true, analysisId };
  } catch (error) {
    logger.error(`Worker error processing analysis ${analysisId}:`, error);

    // Update analysis status to failed
    await Analysis.findByIdAndUpdate(analysisId, {
      status: "failed",
      completedAt: new Date(),
    });

    // Update contract status as well
    if (contractId) {
      await Contract.findByIdAndUpdate(contractId, {
        status: "failed",
      });
    }

    throw error; // Let Bull handle the retry
  }
});
