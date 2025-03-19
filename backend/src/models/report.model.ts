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
      default: new Map(),
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

// Helper methods for working with filePaths
ReportSchema.methods.setFilePath = function (
  format: ReportFormat,
  path: string
) {
  if (!this.filePaths) {
    this.filePaths = new Map();
  }
  this.filePaths.set(format, path);
};

ReportSchema.methods.getFilePath = function (
  format: ReportFormat
): string | undefined {
  return this.filePaths?.get(format);
};

export const Report = mongoose.model<IReport>("Report", ReportSchema);
