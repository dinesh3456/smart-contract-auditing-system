import { analysisQueue } from "../config/queue.config";
import { AnalysisService } from "../services/analysis.service";
import { logger } from "../utils/logger";

const analysisService = new AnalysisService();

// Process analysis jobs from the queue
analysisQueue.process("process-analysis", async (job) => {
  const { contractId, analysisId, sourceCode, options } = job.data;

  logger.info(`Processing analysis job ${job.id} for contract ${contractId}`);

  try {
    await analysisService.processAnalysis(sourceCode, analysisId, options);
    logger.info(`Analysis job ${job.id} completed successfully`);
    return { success: true };
  } catch (error) {
    logger.error(`Analysis job ${job.id} failed:`, error);
    throw error; // This will mark the job as failed in Bull
  }
});

logger.info("Analysis worker started and waiting for jobs");
