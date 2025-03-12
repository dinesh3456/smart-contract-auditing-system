import { Router } from "express";
import { ContractController } from "../controllers/contract.controller";
import { authenticate } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";

// Declare module augmentation for express Request
declare module "express-serve-static-core" {
  interface Request {
    user: {
      id: string;
    };
  }
}

const router = Router();
const contractController = new ContractController();

// Contract routes
router.post(
  "/upload",
  authenticate,
  upload.single("contract"),
  contractController.uploadContract
);
router.get("/", authenticate, contractController.getUserContracts);
router.get("/:id", authenticate, contractController.getContractById);
router.post("/:id/analyze", authenticate, contractController.analyzeContract);
router.get(
  "/:id/analysis",
  authenticate,
  contractController.getAnalysisResults
);
router.delete("/:id", authenticate, contractController.deleteContract);

export default router;
