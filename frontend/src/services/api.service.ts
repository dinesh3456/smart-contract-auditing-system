import axios from "axios";

// Base API URL
const API_URL = "/api";

// Contract Interface
export interface Contract {
  id: string;
  name: string;
  version: string;
  description?: string;
  status: "uploaded" | "analyzing" | "analyzed" | "failed";
  uploadedAt: string;
  lastAnalyzed?: string;
  sourceCode?: string;
}

// Analysis Results Interface
export interface AnalysisResults {
  status: "pending" | "processing" | "completed" | "failed";
  completedAt?: string;
  vulnerabilities?: Array<{
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
  }>;
  gasIssues?: Array<{
    id: string;
    description: string;
    location: {
      line: number;
      column?: number;
      file?: string;
    };
    gasSaved: string;
    recommendation: string;
  }>;
  complianceResults?: Record<
    string,
    {
      standard: string;
      compliant: boolean;
      missingRequirements: string[];
      recommendations: string[];
    }
  >;
  anomalyResults?: {
    isAnomaly: boolean;
    anomalyScore: number;
    anomalyDescription: string;
    anomalyFactors?: any[];
    recommendations?: string[];
  };
  overallRiskRating?: "Critical" | "High" | "Medium" | "Low" | "Informational";
  recommendations?: string[];
}

// Report Interface
export interface Report {
  id: string;
  contractId: string;
  formats: ("pdf" | "html" | "markdown" | "json")[];
  generatedAt: string;
  summary: string;
}

// User Interface
export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
}

// Pagination Interface
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Contract API Service
export const ContractService = {
  // Get all contracts for the authenticated user
  getContracts: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Contract>> => {
    const response = await axios.get(`${API_URL}/contracts`, {
      params: { page, limit },
    });
    return {
      data: response.data.contracts,
      pagination: response.data.pagination,
    };
  },

  // Get contract by ID
  getContract: async (id: string): Promise<Contract> => {
    const response = await axios.get(`${API_URL}/contracts/${id}`);
    return response.data.contract;
  },

  // Upload a new contract
  uploadContract: async (formData: FormData): Promise<Contract> => {
    const response = await axios.post(`${API_URL}/contracts/upload`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.contract;
  },

  // Start analysis for a contract
  analyzeContract: async (
    id: string,
    options?: {
      securityScan?: boolean;
      gasOptimization?: boolean;
      complianceCheck?: boolean;
      anomalyDetection?: boolean;
      standards?: string[];
    }
  ): Promise<{ analysisId: string }> => {
    const response = await axios.post(
      `${API_URL}/contracts/${id}/analyze`,
      options || {}
    );
    return {
      analysisId: response.data.analysisId,
    };
  },

  // Get analysis results
  getAnalysisResults: async (id: string): Promise<AnalysisResults> => {
    const response = await axios.get(`${API_URL}/contracts/${id}/analysis`);
    return response.data.results;
  },

  // Delete a contract
  deleteContract: async (id: string): Promise<void> => {
    await axios.delete(`${API_URL}/contracts/${id}`);
  },
};

// Report API Service
export const ReportService = {
  // Get report for a contract
  getReport: async (contractId: string): Promise<Report> => {
    const response = await axios.get(`${API_URL}/reports/${contractId}`);
    return response.data.report;
  },

  // Generate a new report
  generateReport: async (
    contractId: string,
    formats: ("pdf" | "html" | "markdown" | "json")[]
  ): Promise<{ reportJobId: string }> => {
    const response = await axios.post(
      `${API_URL}/reports/${contractId}/generate`,
      { formats }
    );
    return {
      reportJobId: response.data.reportJobId,
    };
  },

  // Download report URL
  getReportDownloadUrl: (
    contractId: string,
    format: "pdf" | "html" | "markdown" | "json"
  ): string => {
    return `${API_URL}/reports/${contractId}/download/${format}`;
  },
};

// User API Service
export const UserService = {
  // Get user profile
  getProfile: async (): Promise<User> => {
    const response = await axios.get(`${API_URL}/users/profile`);
    return response.data.user;
  },

  // Update user profile
  updateProfile: async (updates: {
    name?: string;
    company?: string;
  }): Promise<User> => {
    const response = await axios.put(`${API_URL}/users/profile`, updates);
    return response.data.user;
  },
};

// Health API Service
export const HealthService = {
  // Check API health
  checkHealth: async (): Promise<{ status: string; database: string }> => {
    const response = await axios.get(`${API_URL}/health`);
    return response.data;
  },

  // Check services health
  checkServices: async (): Promise<{
    status: string;
    services: Array<{
      name: string;
      status: string;
      responseTime: number;
      error?: string;
    }>;
  }> => {
    const response = await axios.get(`${API_URL}/health/services`);
    return response.data;
  },
};
