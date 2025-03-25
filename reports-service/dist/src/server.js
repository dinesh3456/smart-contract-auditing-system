"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importStar(require("express"));
const index_1 = require("./index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const app = (0, express_1.default)();
const router = (0, express_1.Router)();
const port = process.env.PORT || 5003;
const reportsDir = process.env.REPORTS_DIR || path.join(__dirname, "../../reports");
// Ensure reports directory exists
if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
}
// Configure middleware
app.use(express_1.default.json({ limit: "50mb" }));
// Health check endpoint
router.get("/health", (_req, res) => {
    res.json({
        status: "healthy",
        service: "reports-service",
    });
});
// Generate report endpoint
router.post("/api/generate", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const reportData = req.body;
        const reportId = Date.now().toString();
        const contractDir = path.join(reportsDir, reportData.contractName || "unknown");
        // Create directory for this contract
        if (!fs.existsSync(contractDir)) {
            fs.mkdirSync(contractDir, { recursive: true });
        }
        const reportGenerator = new index_1.ReportGenerator();
        const reportFiles = {};
        // Generate PDF report
        const pdfPath = path.join(contractDir, `report-${reportId}.pdf`);
        reportGenerator.generatePDFReport(reportData, pdfPath);
        reportFiles["pdf"] = pdfPath;
        // Generate JSON report
        const jsonPath = path.join(contractDir, `report-${reportId}.json`);
        reportGenerator.generateJSONReport(reportData, jsonPath);
        reportFiles["json"] = jsonPath;
        res.status(200).json({
            success: true,
            reportId,
            reportFiles,
        });
    }
    catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
}));
// Download report endpoint
router.get("/api/reports/:contractName/:reportId/:format", (req, res) => {
    try {
        const { contractName, reportId, format } = req.params;
        const filePath = path.join(reportsDir, contractName, `report-${reportId}.${format}`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: "Report not found",
            });
        }
        // Set appropriate content type
        if (format === "pdf") {
            res.setHeader("Content-Type", "application/pdf");
        }
        else if (format === "json") {
            res.setHeader("Content-Type", "application/json");
        }
        // Set disposition header for download
        res.setHeader("Content-Disposition", `attachment; filename="report-${reportId}.${format}"`);
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error("Error downloading report:", error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
// Register the router
app.use(router);
// Start the server
app.listen(port, () => {
    console.log(`Reports service running on port ${port}`);
});
