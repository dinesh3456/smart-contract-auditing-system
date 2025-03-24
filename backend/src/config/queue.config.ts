import Queue from "bull";
import { logger } from "../utils/logger";
import { Analysis } from "../models/analysis.model"; // Import Analysis model

// Create the analysis job queue with enhanced configuration
export const analysisQueue = new Queue("contract-analysis", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    retryStrategy: (times: number) => {
      if (times > 10) {
        logger.error("Redis connection failed repeatedly, giving up");
        return null; // Stop retrying
      }
      const delay = Math.min(times * 500, 5000);
      logger.warn(
        `Redis connection attempt ${times} failed, retrying in ${delay}ms`
      );
      return delay;
    },
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 7 * 24 * 60 * 60, // Keep successful jobs for 7 days
      count: 1000, // Keep last 1000 successful jobs
    },
    removeOnFail: {
      age: 14 * 24 * 60 * 60, // Keep failed jobs for 14 days
      count: 500, // Keep last 500 failed jobs
    },
  },
});

// Create report generation queue
export const reportQueue = new Queue("report-generation", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 3000, // 3 seconds initial delay
    },
    removeOnComplete: false, // Keep completed jobs for monitoring
    removeOnFail: false,
    timeout: 120000, // 2 minutes timeout for report generation
  },
});

// Schedule cleanup job
analysisQueue.add(
  "cleanup-old-records",
  {},
  {
    repeat: {
      cron: "0 3 * * *", // Run at 3 AM every day
    },
  }
);

// Add a check to only remove analyses without associated reports
analysisQueue.process("cleanup-old-records", async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

  // Find analyses that have no associated reports
  const analysesToDelete = await Analysis.aggregate([
    {
      $match: {
        status: "completed",
        completedAt: { $lt: cutoffDate },
      },
    },
    {
      $lookup: {
        from: "reports",
        localField: "_id",
        foreignField: "analysisId",
        as: "reports",
      },
    },
    {
      $match: { reports: { $size: 0 } },
    },
  ]);

  // Delete only analyses with no reports
  const ids = analysesToDelete.map((a) => a._id);
  await Analysis.deleteMany({ _id: { $in: ids } });

  logger.info(`Cleaned up ${ids.length} orphaned analysis records`);
});

// Enhanced error handling for analysis queue
analysisQueue.on("error", (error) => {
  logger.error(`Analysis queue error: ${error.message}`, {
    stack: error.stack,
  });
});

analysisQueue.on("failed", (job, error) => {
  logger.error(
    `Analysis job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    {
      jobData: job.data,
      stack: error.stack,
    }
  );
});

analysisQueue.on("stalled", (job) => {
  logger.warn(`Analysis job ${job.id} stalled`, { jobData: job.data });
});

analysisQueue.on("completed", (job, result) => {
  logger.info(`Analysis job ${job.id} completed successfully`, {
    result,
    processingTime: job.finishedOn
      ? job.finishedOn - job.processedOn!
      : undefined,
  });
});

// Enhanced error handling for report queue
reportQueue.on("error", (error) => {
  logger.error(`Report queue error: ${error.message}`, {
    stack: error.stack,
  });
});

reportQueue.on("failed", (job, error) => {
  logger.error(
    `Report generation job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`,
    {
      jobData: job.data,
      stack: error.stack,
    }
  );
});

reportQueue.on("stalled", (job) => {
  logger.warn(`Report generation job ${job.id} stalled`, { jobData: job.data });
});

reportQueue.on("completed", (job) => {
  logger.info(`Report generation job ${job.id} completed successfully`, {
    processingTime: job.finishedOn
      ? job.finishedOn - job.processedOn!
      : undefined,
  });
});

// Optional: Add cleanup logic for old jobs
setInterval(async () => {
  try {
    // Clean completed jobs older than 1 day
    await analysisQueue.clean(24 * 60 * 60 * 1000, "completed");
    await reportQueue.clean(24 * 60 * 60 * 1000, "completed");

    // Clean failed jobs older than 7 days
    await analysisQueue.clean(7 * 24 * 60 * 60 * 1000, "failed");
    await reportQueue.clean(7 * 24 * 60 * 60 * 1000, "failed");
  } catch (error) {
    logger.error("Error cleaning old jobs:", error);
  }
}, 6 * 60 * 60 * 1000); // Run every 6 hours
