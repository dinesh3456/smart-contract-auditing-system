import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const reportController = new ReportController();

// Report routes
router.get(
  "/:contractId",
  authenticate,
  reportController.getReportByContractId
);
router.get(
  "/:contractId/download/:format",
  authenticate,
  reportController.downloadReport
);
router.post(
  "/:contractId/generate",
  authenticate,
  reportController.generateReport
);

export default router;
