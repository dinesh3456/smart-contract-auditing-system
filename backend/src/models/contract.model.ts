// src/models/contract.model.ts
import mongoose, { Document, Schema } from "mongoose";

export type ContractStatus = "uploaded" | "analyzing" | "analyzed" | "failed";

export interface IContract extends Document {
  name: string;
  version: string;
  description?: string;
  sourceCode: string;
  owner: mongoose.Types.ObjectId;
  status: ContractStatus;
  address?: string;
  filePath: string;
  fileName: string;
  lastAnalyzed?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ContractSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    version: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    sourceCode: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["uploaded", "analyzing", "analyzed", "failed"],
      default: "uploaded",
    },
    address: {
      type: String,
      trim: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    lastAnalyzed: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Contract = mongoose.model<IContract>("Contract", ContractSchema);
