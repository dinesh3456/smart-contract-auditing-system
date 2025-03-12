import { Router } from "express";
import { HealthController } from "../controllers/health.controller";

const router = Router();
const healthController = new HealthController();

// Health check routes
router.get("/", healthController.checkHealth);
router.get("/services", healthController.checkServices);

export default router;
