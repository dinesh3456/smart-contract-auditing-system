import { Request, Response } from "express";
import { reportQueue } from "../config/queue.config";
import { logger } from "../utils/logger";

export class AdminController {
  /**
   * Manually process a report job
   */
  public processReportJob = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const { jobId } = req.params;

      // Get the job from the queue
      const job = await reportQueue.getJob(jobId);

      if (!job) {
        res.status(404).json({ success: false, message: "Job not found" });
        return;
      }

      // Log job details
      logger.info(`Processing job ${jobId} manually:`, job.data);

      // Process the job
      const result = await job.finished();

      res.status(200).json({
        success: true,
        message: "Job processed successfully",
        result,
      });
    } catch (error) {
      logger.error("Error processing report job:", error);
      res.status(500).json({
        success: false,
        message: "Failed to process report job",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  /**
   * Get queue status
   */
  public getQueueStatus = async (_: Request, res: Response): Promise<void> => {
    try {
      const [active, waiting, completed, failed] = await Promise.all([
        reportQueue.getActive(),
        reportQueue.getWaiting(),
        reportQueue.getCompleted(),
        reportQueue.getFailed(),
      ]);

      res.status(200).json({
        success: true,
        status: {
          active: active.length,
          waiting: waiting.length,
          completed: completed.length,
          failed: failed.length,
          activeJobs: active.map((job) => ({ id: job.id, data: job.data })),
          failedJobs: failed.map((job) => ({
            id: job.id,
            data: job.data,
            failedReason: job.failedReason,
          })),
        },
      });
    } catch (error) {
      logger.error("Error getting queue status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get queue status",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
