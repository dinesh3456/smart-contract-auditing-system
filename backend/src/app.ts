import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware";
import { apiLimiter, authLimiter } from "./middleware/rate-limit.middleware";
import userRoutes from "./routes/user.routes";
import contractRoutes from "./routes/contract.routes";
import reportRoutes from "./routes/report.routes";
import healthRoutes from "./routes/health.routes";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Apply stricter rate limiting to auth routes
app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/health", healthRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
});

// Error handling middleware
app.use(errorHandler);

export default app;
