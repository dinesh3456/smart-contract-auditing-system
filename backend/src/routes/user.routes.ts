import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const userController = new UserController();

// User routes
router.post("/register", userController.register);
router.post("/login", userController.login);
router.get("/profile", authenticate, userController.getProfile);
router.put("/profile", authenticate, userController.updateProfile);
router.post("/logout", authenticate, userController.logout);

export default router;
