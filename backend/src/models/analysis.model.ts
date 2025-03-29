// src/models/analysis.model.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IVulnerability {
  id: string;
  name: string;
  description: string;
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
  location: {
    line: number;
    column?: number;
    file?: string;
  };
  details: string;
  recommendation: string;
}

const RecommendationSchema = new Schema(
  {
    type: String,
    description: String,
    impact: String,
    line: Number,
    suggestion: String,
    function: String,
  },
  { _id: false }
);

export interface IGasIssue {
  id: string;
  description: string;
  location: {
    line: number;
    column?: number;
    file?: string;
  };
  gasSaved: string;
  recommendation: string;
}

export interface IComplianceResult {
  standard: string;
  compliant: boolean;
  missingRequirements: string[];
  recommendations: string[];
}

export interface IAnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number;
  anomalyDescription: string;
  anomalyFactors?: any[];
  recommendations: string[];
}

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";
export type RiskRating =
  | "Critical"
  | "High"
  | "Medium"
  | "Low"
  | "Informational";

export interface IAnalysis extends Document {
  executiveSummary: string;
  _id: mongoose.Types.ObjectId;
  contractId: mongoose.Types.ObjectId;
  status: AnalysisStatus;
  vulnerabilities: IVulnerability[];
  gasIssues: IGasIssue[];
  complianceResults: Record<string, IComplianceResult>;
  anomalyResults?: IAnomalyResult;
  overallRiskRating: RiskRating;
  recommendations: string[];
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const VulnerabilitySchema = new Schema(
  {
    id: String,
    name: String,
    description: String,
    severity: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low", "Informational"],
    },
    location: {
      line: Number,
      column: Number,
      file: String,
    },
    details: String,
    recommendation: String,
  },
  { _id: false }
);

const GasIssueSchema = new Schema(
  {
    id: String,
    description: String,
    location: {
      line: Number,
      column: Number,
      file: String,
    },
    gasSaved: String,
    recommendation: String,
  },
  { _id: false }
);

const ComplianceResultSchema = new Schema(
  {
    standard: String,
    compliant: Boolean,
    missingRequirements: [String],
    recommendations: [String],
  },
  { _id: false }
);

const AnomalyResultSchema = new Schema(
  {
    isAnomaly: Boolean,
    anomalyScore: Number,
    anomalyDescription: String,
    anomalyFactors: [Schema.Types.Mixed],
    recommendations: [String],
  },
  { _id: false }
);

const AnalysisSchema: Schema = new Schema(
  {
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    vulnerabilities: [VulnerabilitySchema],
    gasIssues: [GasIssueSchema],
    complianceResults: {
      type: Map,
      of: ComplianceResultSchema,
    },
    anomalyResults: AnomalyResultSchema,
    overallRiskRating: {
      type: String,
      enum: ["Critical", "High", "Medium", "Low", "Informational"],
    },
    recommendations: [RecommendationSchema],
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Analysis = mongoose.model<IAnalysis>("Analysis", AnalysisSchema);
