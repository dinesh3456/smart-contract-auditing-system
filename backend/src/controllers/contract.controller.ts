import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { ContractService } from "../services/contract.service";
import { AnalysisService } from "../services/analysis.service";
import { validateContract } from "../utils/validator";
import { logger } from "../utils/logger";
import * as multer from "multer";

// // Define multer file type for clarity
// interface MulterFile {
//   fieldname: string;
//   originalname: string;
//   encoding: string;
//   mimetype: string;
//   size: number;
//   destination: string;
//   filename: string;
//   path: string;
//   buffer?: Buffer;
//   stream: Readable;
// }

// Special interface for the upload endpoint only
interface RequestWithFile extends Request {
  file: Express.Multer.File;
  user: {
    id: string;
    [key: string]: any;
  };
}

export class ContractController {
  private contractService: ContractService;
  private analysisService: AnalysisService;

  constructor() {
    this.contractService = new ContractService();
    this.analysisService = new AnalysisService();
  }

  /**
   * Upload a new smart contract
   */
  public uploadContract = async (
    req: RequestWithFile,
    res: Response
  ): Promise<void> => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        res
          .status(400)
          .json({ success: false, message: "No contract file uploaded" });
        return;
      }

      const contractFile = req.file;
      const userId = req.user.id;
      const contractName =
        req.body.name ||
        path.basename(
          contractFile.originalname,
          path.extname(contractFile.originalname)
        );
      const contractVersion = req.body.version || "1.0.0";
      const contractDescription = req.body.description || "";

      // Read contract source code
      const contractSource = fs.readFileSync(contractFile.path, "utf8");

      // Validate contract (basic syntax check)
      const validationResult = validateContract(contractSource);
      if (!validationResult.isValid) {
        res.status(400).json({
          success: false,
          message: "Invalid contract",
          errors: validationResult.errors,
        });
        return;
      }

      // Save contract to database
      const contract = await this.contractService.createContract({
        name: contractName,
        version: contractVersion,
        description: contractDescription,
        sourceCode: contractSource,
        owner: userId,
        filePath: contractFile.path,
        fileName: contractFile.originalname,
      });

      // Clean up temp file if needed
      // fs.unlinkSync(contractFile.path);

      res.status(201).json({
        success: true,
        message: "Contract uploaded successfully",
        contract: {
          id: contract._id,
          name: contract.name,
          version: contract.version,
          description: contract.description,
          uploadedAt: contract.createdAt,
        },
      });
    } catch (error) {
      logger.error("Error uploading contract:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to upload contract" });
    }
  };

  /**
   * Get all contracts for current user
   */
  public getUserContracts = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.contractService.getContractsByUser(
        userId,
        page,
        limit
      );

      res.status(200).json({
        success: true,
        contracts: result.contracts.map((contract) => ({
          id: contract._id,
          name: contract.name,
          version: contract.version,
          description: contract.description,
          status: contract.status,
          uploadedAt: contract.createdAt,
        })),
        pagination: {
          total: result.total,
          page,
          limit,
          pages: Math.ceil(result.total / limit),
        },
      });
    } catch (error) {
      logger.error("Error fetching user contracts:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch contracts" });
    }
  };

  /**
   * Get contract by ID
   */
  public getContractById = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;

      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      res.status(200).json({
        success: true,
        contract: {
          id: contract._id,
          name: contract.name,
          version: contract.version,
          description: contract.description,
          status: contract.status,
          sourceCode: contract.sourceCode,
          uploadedAt: contract.createdAt,
          lastAnalyzed: contract.lastAnalyzed,
        },
      });
    } catch (error) {
      logger.error("Error fetching contract by ID:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch contract" });
    }
  };

  /**
   * Initiate contract analysis
   */
  public analyzeContract = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Start analysis (this might be an async process in a real implementation)
      const analysisOptions = {
        securityScan: req.body.securityScan !== false,
        gasOptimization: req.body.gasOptimization !== false,
        complianceCheck: req.body.complianceCheck !== false,
        anomalyDetection: req.body.anomalyDetection !== false,
        standards: req.body.standards || ["erc20", "erc721"],
      };

      // Update contract status
      await this.contractService.updateContractStatus(contractId, "analyzing");

      // Start analysis job (in a real system, this would be a queue job)
      const analysisId = await this.analysisService.startAnalysis(
        contractId,
        analysisOptions
      );

      res.status(202).json({
        success: true,
        message: "Contract analysis started",
        analysisId,
        contractId,
      });
    } catch (error) {
      logger.error("Error initiating contract analysis:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to initiate analysis" });
    }
  };

  /**
   * Get analysis results
   */
  public getAnalysisResults = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Get analysis results
      const results = await this.analysisService.getAnalysisResults(contractId);

      if (!results) {
        res
          .status(404)
          .json({ success: false, message: "Analysis results not found" });
        return;
      }

      res.status(200).json({
        success: true,
        contractId,
        status: results.status,
        completedAt: results.completedAt,
        results: {
          vulnerabilities: results.vulnerabilities,
          gasIssues: results.gasIssues,
          complianceResults: results.complianceResults,
          anomalyResults: results.anomalyResults,
          overallRiskRating: results.overallRiskRating,
          recommendations: results.recommendations,
        },
      });
    } catch (error) {
      logger.error("Error fetching analysis results:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch analysis results" });
    }
  };

  /**
   * Delete contract
   */
  public deleteContract = async (
    req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const contractId = req.params.id;
      const userId = req.user.id;

      // Check if user has access to this contract
      const contract = await this.contractService.getContractById(
        contractId,
        userId
      );

      if (!contract) {
        res.status(404).json({ success: false, message: "Contract not found" });
        return;
      }

      // Delete contract (and associated analysis results)
      await this.contractService.deleteContract(contractId);

      res.status(200).json({
        success: true,
        message: "Contract deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting contract:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to delete contract" });
    }
  };
}
