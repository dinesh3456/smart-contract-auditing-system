// src/services/contract.service.ts
import { Contract, IContract, ContractStatus } from "../models/contract.model";
import mongoose from "mongoose";
import { logger } from "../utils/logger";

interface ContractCreateData {
  name: string;
  version: string;
  description?: string;
  sourceCode: string;
  owner: string | mongoose.Types.ObjectId;
  filePath: string;
  fileName: string;
  address?: string;
}

interface ContractQueryResult {
  contracts: IContract[];
  total: number;
}

export class ContractService {
  /**
   * Create a new contract
   */
  public async createContract(data: ContractCreateData): Promise<IContract> {
    try {
      const contract = new Contract({
        name: data.name,
        version: data.version,
        description: data.description,
        sourceCode: data.sourceCode,
        owner: data.owner,
        filePath: data.filePath,
        fileName: data.fileName,
        address: data.address,
        status: "uploaded",
      });

      await contract.save();
      return contract;
    } catch (error) {
      logger.error("Error creating contract:", error);
      throw error;
    }
  }

  /**
   * Get a contract by ID
   */
  public async getContractById(
    contractId: string,
    userId: string
  ): Promise<IContract | null> {
    try {
      // Ensure the user owns the contract
      return await Contract.findOne({
        _id: contractId,
        owner: userId,
      });
    } catch (error) {
      logger.error(`Error getting contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Get contracts by user ID with pagination
   */
  public async getContractsByUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ContractQueryResult> {
    try {
      const skip = (page - 1) * limit;

      const [contracts, total] = await Promise.all([
        Contract.find({ owner: userId })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Contract.countDocuments({ owner: userId }),
      ]);

      return { contracts, total };
    } catch (error) {
      logger.error(`Error getting contracts for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update contract status
   */
  public async updateContractStatus(
    contractId: string,
    status: ContractStatus
  ): Promise<IContract | null> {
    try {
      const updates: any = { status };

      // If status is 'analyzed', update lastAnalyzed timestamp
      if (status === "analyzed") {
        updates.lastAnalyzed = new Date();
      }

      return await Contract.findByIdAndUpdate(contractId, updates, {
        new: true,
      });
    } catch (error) {
      logger.error(`Error updating contract status for ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a contract
   */
  public async deleteContract(contractId: string): Promise<boolean> {
    try {
      const result = await Contract.deleteOne({ _id: contractId });
      return result.deletedCount === 1;
    } catch (error) {
      logger.error(`Error deleting contract ${contractId}:`, error);
      throw error;
    }
  }

  /**
   * Search contracts by name, description, or address
   */
  public async searchContracts(
    userId: string,
    query: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ContractQueryResult> {
    try {
      const skip = (page - 1) * limit;

      const searchQuery = {
        owner: userId,
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { address: { $regex: query, $options: "i" } },
        ],
      };

      const [contracts, total] = await Promise.all([
        Contract.find(searchQuery)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Contract.countDocuments(searchQuery),
      ]);

      return { contracts, total };
    } catch (error) {
      logger.error(`Error searching contracts for user ${userId}:`, error);
      throw error;
    }
  }
}
