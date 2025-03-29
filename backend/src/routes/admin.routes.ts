import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();
const adminController = new AdminController();

// Admin routes
router.get(
  "/queue/status",
  authenticate,
  authorize(["admin"]),
  adminController.getQueueStatus
);

router.post(
  "/queue/jobs/:jobId/process",
  authenticate,
  authorize(["admin"]),
  adminController.processReportJob
);

export default router;
