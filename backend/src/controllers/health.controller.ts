import { Request, Response } from "express";
import mongoose from "mongoose";
import { logger } from "../utils/logger";
import axios from "axios";

export class HealthController {
  /**
   * Basic health check for the API
   */
  public checkHealth = async (_req: Request, res: Response): Promise<void> => {
    try {
      // Check database connection
      const dbStatus =
        mongoose.connection.readyState === 1 ? "connected" : "disconnected";

      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "smart-contract-audit-api",
        database: dbStatus,
      });
    } catch (error) {
      logger.error("Health check failed:", error);
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Health check failed",
      });
    }
  };

  private async checkServiceHealth(
    serviceName: string,
    healthUrl: string
  ): Promise<boolean> {
    try {
      const response = await axios.get(healthUrl, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      logger.warn(`${serviceName} service is not healthy:`, error);
      return false;
    }
  }

  /**
   * Check status of all services in the platform
   */
  public checkServices = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      // Define all services to check
      const services = [
        { name: "database", url: null, type: "internal" },
        {
          name: "analysis-engine",
          url:
            (process.env.ANALYSIS_ENGINE_URL ||
              (process.env.NODE_ENV === "production"
                ? "http://analysis-engine:5001"
                : "http://localhost:5001")) + "/health",
          type: "http",
        },
        {
          name: "ai-detector",
          url:
            (process.env.AI_DETECTOR_URL ||
              (process.env.NODE_ENV === "production"
                ? "http://ai-detector:5002"
                : "http://localhost:5002")) + "/health",
          type: "http",
        },
        {
          name: "reports-service",
          url:
            (process.env.REPORTS_SERVICE_URL ||
              (process.env.NODE_ENV === "production"
                ? "http://reports-service:5003"
                : "http://localhost:5003")) + "/health",
          type: "http",
        },
      ];

      // Check each service
      const results = await Promise.all(
        services.map(async (service) => {
          try {
            if (service.type === "internal") {
              if (service.name === "database") {
                const dbStatus =
                  mongoose.connection.readyState === 1
                    ? "healthy"
                    : "unhealthy";
                return {
                  name: service.name,
                  status: dbStatus,
                  responseTime: 0,
                };
              }
              return {
                name: service.name,
                status: "unknown",
                responseTime: 0,
              };
            } else if (service.type === "http" && service.url) {
              const startTime = Date.now();
              const response = await axios.get(service.url, { timeout: 5000 });
              const responseTime = Date.now() - startTime;

              return {
                name: service.name,
                status: response.status === 200 ? "healthy" : "unhealthy",
                responseTime,
              };
            }
            return {
              name: service.name,
              status: "unknown",
              responseTime: 0,
            };
          } catch (err) {
            const error = err as Error;
            return {
              name: service.name,
              status: "unhealthy",
              error: error.message,
            };
          }
        })
      );

      // Determine overall status
      const allHealthy = results.every((result) => result.status === "healthy");
      const overall = allHealthy ? "healthy" : "degraded";

      // Send response with service statuses
      res.status(200).json({
        status: overall,
        timestamp: new Date().toISOString(),
        services: results,
      });
    } catch (error) {
      logger.error("Service health check failed:", error);
      res.status(500).json({
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Service health check failed",
      });
    }
  };
}
