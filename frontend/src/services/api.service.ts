import axios from "axios";

// Base API URL
const API_URL = import.meta.env.VITE_API_URL1 || "http://localhost:5000/api";
// Contract Interface
export interface Contract {
  id: string;
  name: string;
  version: string;
  description?: string;
  status: "uploaded" | "analyzing" | "analyzed" | "failed";
  uploadedAt: string;
  progress?: number;
  lastAnalyzed?: string;
  sourceCode?: string;
}

// Analysis Results Interface
export interface AnalysisResults {
  formattedRecommendations: string[];
  error: any;
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
    recommendations: any[];
    formattedRecommendations?: string[];
  };
  overallRiskRating?: "Critical" | "High" | "Medium" | "Low" | "Informational";
  recommendations?:
    | string
    | {
        description: string;
        suggestion?: string;
      };
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

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with an error status (4xx, 5xx)
      console.error(`API Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error("API No Response Error:", error.request);
    } else {
      // Error in setting up the request
      console.error("API Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

const authToken = localStorage.getItem("token");
if (authToken) {
  axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
}

// Contract API Service
export const ContractService = {
  // Get all contracts for the authenticated user
  getContracts: async (
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<Contract>> => {
    try {
      const response = await apiClient.get(`${API_URL}/contracts`, {
        params: { page, limit },
      });

      // Add defensive checks
      if (!response || !response.data) {
        throw new Error("Empty response from server");
      }

      // Ensure response has expected structure
      if (!response.data.contracts) {
        console.warn("Unexpected API response format:", response.data);
        // Return a safe default
        return {
          data: [],
          pagination: {
            total: 0,
            page: page,
            limit: limit,
            pages: 0,
          },
        };
      }

      return {
        data: response.data.contracts,
        pagination: response.data.pagination || {
          total: response.data.contracts.length,
          page: page,
          limit: limit,
          pages: Math.ceil(response.data.contracts.length / limit),
        },
      };
    } catch (error) {
      console.error("API error in getContracts:", error);
      // Re-throw to allow component to handle
      throw error;
    }
  },

  // Get contract by ID
  getContract: async (id: string): Promise<Contract> => {
    const response = await apiClient.get(`${API_URL}/contracts/${id}`);
    return response.data.contract;
  },

  // Upload a new contract
  uploadContract: async (formData: FormData): Promise<Contract> => {
    const response = await apiClient.post(
      `${API_URL}/contracts/upload`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.contract;
  },
  updateContractStatus: async (
    id: string,
    status: string
  ): Promise<Contract> => {
    const response = await apiClient.patch(
      `${API_URL}/contracts/${id}/status`,
      {
        status,
      }
    );
    return response.data.contract;
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await apiClient.get("/health");
      return response.data.status === "ok";
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  },

  // Add this to ContractService
  debugContractRequest: async (id: string): Promise<any> => {
    try {
      console.log("Attempting to fetch contract:", id);
      const response = await apiClient.get(`/contracts/${id}`, {
        validateStatus: () => true, // Accept any HTTP status to see what's happening
      });
      console.log("Raw API response:", response);
      return {
        status: response.status,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      console.error("Debug request failed:", error);
      return { error: error };
    }
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
    try {
      const response = await apiClient.post(
        `${API_URL}/contracts/${id}/analyze`,
        options || {}
      );
      return {
        analysisId: response.data.analysisId,
      };
    } catch (error: any) {
      console.error(`Error starting analysis for contract ${id}:`, error);

      // Add more context to the error
      if (error.response?.status === 400) {
        throw new Error(
          `Invalid contract: ${
            error.response.data.message || "Cannot analyze this contract"
          }`
        );
      } else if (error.response?.status === 404) {
        throw new Error("Contract not found");
      } else if (error.response?.status === 500) {
        throw new Error(
          `Server error: ${
            error.response.data.message || "Internal server error"
          }`
        );
      }
      throw error;
    }
  },

  // Get analysis results
  getAnalysisResults: async (id: string): Promise<AnalysisResults> => {
    try {
      const response = await apiClient.get(
        `${API_URL}/contracts/${id}/analysis`
      );

      // Defensive check for empty or malformed response
      if (!response.data || !response.data.results) {
        throw new Error("Invalid analysis results structure from server");
      }

      return response.data.results;
    } catch (error: any) {
      console.error(
        `Error fetching analysis results for contract ${id}:`,
        error
      );

      // Create a more descriptive error that includes status code and error message
      const statusCode = error.response?.status;
      const serverMessage =
        error.response?.data?.message || "Unknown server error";

      if (statusCode === 404) {
        throw new Error(`Analysis not found: ${serverMessage}`);
      } else if (statusCode === 500) {
        throw new Error(`Server error retrieving analysis: ${serverMessage}`);
      } else if (
        error.code === "ECONNABORTED" ||
        error.message.includes("timeout")
      ) {
        throw new Error(
          "Analysis request timed out. The server may be under heavy load."
        );
      } else {
        throw new Error(`Error retrieving analysis results: ${error.message}`);
      }
    }
  },

  // Delete a contract
  deleteContract: async (id: string): Promise<void> => {
    await apiClient.delete(`${API_URL}/contracts/${id}`);
  },
};

// Report API Service
export const ReportService = {
  // Get report for a contract
  getReport: async (contractId: string): Promise<Report> => {
    const response = await apiClient.get(`${API_URL}/reports/${contractId}`);
    return response.data.report;
  },

  // Generate a new report
  generateReport: async (
    contractId: string,
    formats: ("pdf" | "html" | "markdown" | "json")[]
  ): Promise<{ reportJobId: string }> => {
    const response = await apiClient.post(
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
    const response = await apiClient.get(`${API_URL}/users/profile`);
    return response.data.user;
  },

  // Update user profile
  updateProfile: async (updates: {
    name?: string;
    company?: string;
  }): Promise<User> => {
    const response = await apiClient.put(`${API_URL}/users/profile`, updates);
    return response.data.user;
  },
};

// Health API Service
export const HealthService = {
  // Check API health
  checkHealth: async (): Promise<{ status: string; database: string }> => {
    const response = await apiClient.get(`${API_URL}/health`);
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
    const response = await apiClient.get(`${API_URL}/health/services`);
    return response.data;
  },
};
