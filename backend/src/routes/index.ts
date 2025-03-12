import { Router } from "express";
import contractRoutes from "./contract.routes";
import userRoutes from "./user.routes";
import reportRoutes from "./report.routes";
import healthRoutes from "./health.routes";

const router = Router();

// API Routes
router.use("/contracts", contractRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportRoutes);
router.use("/health", healthRoutes);

export default router;
