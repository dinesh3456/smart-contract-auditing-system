// backend/src/models/report.model.ts
import mongoose, { Document, Schema } from "mongoose";

export enum ReportFormat {
  PDF = "pdf",
  HTML = "html",
  JSON = "json",
  MARKDOWN = "markdown",
}

export interface IReport extends Document {
  contractId: mongoose.Types.ObjectId;
  analysisId: mongoose.Types.ObjectId;
  status: "pending" | "generating" | "completed" | "failed";
  filePaths: Record<ReportFormat, string>;
  availableFormats: ReportFormat[];
  summary: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    analysisId: {
      type: Schema.Types.ObjectId,
      ref: "Analysis",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "generating", "completed", "failed"],
      default: "pending",
    },
    filePaths: {
      type: Map,
      of: String,
    },
    availableFormats: [
      {
        type: String,
        enum: Object.values(ReportFormat),
      },
    ],
    summary: String,
    error: String,
  },
  {
    timestamps: true,
  }
);

export const Report = mongoose.model<IReport>("Report", ReportSchema);
