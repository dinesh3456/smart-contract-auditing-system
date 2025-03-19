import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  Tab,
  Tabs,
  Divider,
  CircularProgress,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Description as DescriptionIcon,
  BugReport as BugIcon,
  LocalGasStation as GasIcon,
  Check as CheckIcon,
  PlayArrow as StartIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedUserIcon,
  DataObject as DataObjectIcon,
} from "@mui/icons-material";
import { useParams, useNavigate } from "react-router-dom";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomOneDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import AnimatedElement from "../../components/common/AnimatedElement";
import {
  ContractService,
  ReportService,
  Contract,
  AnalysisResults,
} from "../../services/api.service";

// Interface for tab panels
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contract-tabpanel-${index}`}
      aria-labelledby={`contract-tab-${index}`}
      {...other}
      style={{ padding: "16px 0" }}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

// Helper function for tab accessibility
const a11yProps = (index: number) => {
  return {
    id: `contract-tab-${index}`,
    "aria-controls": `contract-tabpanel-${index}`,
  };
};

// Severity chip component
interface SeverityChipProps {
  severity: "Critical" | "High" | "Medium" | "Low" | "Informational";
}

const SeverityChip: React.FC<SeverityChipProps> = ({ severity }) => {
  const colorMap = {
    Critical: "error",
    High: "error",
    Medium: "warning",
    Low: "success",
    Informational: "info",
  };

  return (
    <Chip label={severity} color={colorMap[severity] as any} size="small" />
  );
};

// Status chip component
interface StatusChipProps {
  status: "uploaded" | "analyzing" | "analyzed" | "failed";
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const statusConfig = {
    uploaded: { label: "Uploaded", color: "info" as const },
    analyzing: { label: "Analyzing", color: "warning" as const },
    analyzed: { label: "Analyzed", color: "success" as const },
    failed: { label: "Failed", color: "error" as const },
  };

  const config = statusConfig[status];

  return <Chip label={config.label} color={config.color} size="small" />;
};

const ContractDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // State for contract and analysis data
  const [contract, setContract] = useState<Contract | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Fetch contract and analysis data
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Fetch contract details
        const contractData = await ContractService.getContract(id);
        setContract(contractData);

        // Fetch analysis results if contract is analyzed
        if (
          contractData.status === "analyzed" ||
          contractData.status === "analyzing"
        ) {
          try {
            const analysisData = await ContractService.getAnalysisResults(id);
            setAnalysis(analysisData);
          } catch (err) {
            console.error("Error fetching analysis:", err);
            // Don't set an error for this, as the contract data is still valid
          }
        }

        setError("");
      } catch (err) {
        console.error("Error fetching contract details:", err);
        setError("Failed to load contract details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Function to start contract analysis
  const handleStartAnalysis = async () => {
    if (!id) return;

    try {
      setAnalysisLoading(true);
      await ContractService.analyzeContract(id);

      // Update contract status
      const updatedContract = await ContractService.getContract(id);
      setContract(updatedContract);

      // Set analysis to a pending state
      setAnalysis({
        status: "processing",
        vulnerabilities: [],
        gasIssues: [],
        complianceResults: {},
        recommendations: [],
      });
    } catch (err) {
      console.error("Error starting analysis:", err);
      setError("Failed to start contract analysis. Please try again.");
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Function to check analysis status periodically
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (analysis && analysis.status === "processing") {
      intervalId = setInterval(async () => {
        if (!id) return;

        try {
          const analysisData = await ContractService.getAnalysisResults(id);
          setAnalysis(analysisData);

          // If analysis is complete, update contract data as well
          if (
            analysisData.status === "completed" ||
            analysisData.status === "failed"
          ) {
            const updatedContract = await ContractService.getContract(id);
            setContract(updatedContract);
            clearInterval(intervalId);
          }
        } catch (err) {
          console.error("Error checking analysis status:", err);
          // Don't clear the interval, keep trying
        }
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [analysis, id]);

  // Function to handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  // Function to delete contract
  const handleDeleteContract = async () => {
    if (!id) return;

    try {
      await ContractService.deleteContract(id);
      navigate("/contracts");
    } catch (err) {
      console.error("Error deleting contract:", err);
      setError("Failed to delete contract. Please try again.");
    }
  };

  // Function to generate report
  const handleGenerateReport = async () => {
    if (!id) return;

    try {
      setGeneratingReport(true);
      await ReportService.generateReport(id, ["pdf", "markdown", "html"]);
      // Navigate to report page or show success message
      navigate(`/reports/${id}`);
    } catch (err) {
      console.error("Error generating report:", err);
      setError("Failed to generate report. Please try again.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // Function to download contract source code
  const handleDownloadSourceCode = () => {
    if (!contract) return;

    const blob = new Blob([contract.sourceCode || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contract.name}-${contract.version}.sol`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <Box sx={{ my: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: "center" }}>
          Loading contract details...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/contracts")}>
          Back to Contracts
        </Button>
      </Box>
    );
  }

  if (!contract) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Contract not found
        </Alert>
        <Button variant="outlined" onClick={() => navigate("/contracts")}>
          Back to Contracts
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Contract Header */}
      <AnimatedElement animation="slideUp">
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="h3"
                component="h1"
                gutterBottom
                fontWeight="bold"
              >
                {contract.name}
              </Typography>
              <Typography
                variant="subtitle1"
                color="text.secondary"
                sx={{ mb: 2 }}
              >
                Version: {contract.version}
              </Typography>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <StatusChip status={contract.status} />
                {analysis && analysis.overallRiskRating && (
                  <Chip
                    label={`Risk: ${analysis.overallRiskRating}`}
                    color={
                      analysis.overallRiskRating === "Critical" ||
                      analysis.overallRiskRating === "High"
                        ? "error"
                        : analysis.overallRiskRating === "Medium"
                        ? "warning"
                        : "success"
                    }
                    size="small"
                  />
                )}
                <Typography variant="body2" color="text.secondary">
                  Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
                </Typography>
                {contract.lastAnalyzed && (
                  <Typography variant="body2" color="text.secondary">
                    Analyzed:{" "}
                    {new Date(contract.lastAnalyzed).toLocaleDateString()}
                  </Typography>
                )}
              </Box>

              {contract.description && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {contract.description}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {contract.status === "uploaded" && (
                <GradientButton
                  variant="contained"
                  gradient="primary"
                  startIcon={
                    analysisLoading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <StartIcon />
                    )
                  }
                  onClick={handleStartAnalysis}
                  disabled={analysisLoading}
                >
                  Start Analysis
                </GradientButton>
              )}

              {contract.status === "analyzing" && (
                <Box sx={{ textAlign: "center" }}>
                  <LinearProgress
                    color="warning"
                    sx={{ mb: 1, minWidth: "200px" }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Analysis in progress...
                  </Typography>
                </Box>
              )}

              {contract.status === "analyzed" && (
                <GradientButton
                  variant="contained"
                  gradient="secondary"
                  startIcon={
                    generatingReport ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <DescriptionIcon />
                    )
                  }
                  onClick={handleGenerateReport}
                  disabled={generatingReport}
                >
                  Generate Report
                </GradientButton>
              )}

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadSourceCode}
              >
                Download Source
              </Button>

              {!deleteConfirm ? (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteConfirm(true)}
                >
                  Delete
                </Button>
              ) : (
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={handleDeleteContract}
                >
                  Confirm Delete
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </AnimatedElement>

      {/* Contract Analysis Status */}
      {contract.status === "analyzing" && (
        <AnimatedElement animation="fadeIn">
          <GlassCard sx={{ mb: 4, p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CircularProgress size={24} color="warning" />
              <Typography variant="h6">
                Contract Analysis in Progress
              </Typography>
            </Box>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              We're analyzing your contract for vulnerabilities, optimization
              opportunities, and standard compliance. This process may take a
              few minutes. You can stay on this page to see the results when
              they're ready.
            </Typography>
          </GlassCard>
        </AnimatedElement>
      )}

      {/* Contract Tabs */}
      <AnimatedElement animation="slideUp" delay={0.1}>
        <GlassCard>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              aria-label="contract details tabs"
              textColor="primary"
              indicatorColor="primary"
            >
              <Tab
                icon={<DataObjectIcon />}
                label="Source Code"
                {...a11yProps(0)}
              />

              {(contract.status === "analyzed" ||
                contract.status === "analyzing") && (
                <Tab
                  icon={<BugIcon />}
                  label="Vulnerabilities"
                  {...a11yProps(1)}
                  disabled={contract.status === "analyzing"}
                />
              )}

              {(contract.status === "analyzed" ||
                contract.status === "analyzing") && (
                <Tab
                  icon={<GasIcon />}
                  label="Gas Optimization"
                  {...a11yProps(2)}
                  disabled={contract.status === "analyzing"}
                />
              )}

              {(contract.status === "analyzed" ||
                contract.status === "analyzing") && (
                <Tab
                  icon={<VerifiedUserIcon />}
                  label="Compliance"
                  {...a11yProps(3)}
                  disabled={contract.status === "analyzing"}
                />
              )}
            </Tabs>
          </Box>

          {/* Source Code Tab */}
          <TabPanel value={selectedTab} index={0}>
            <Box sx={{ position: "relative" }}>
              <Box sx={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}>
                <Tooltip title="Download Source Code">
                  <IconButton onClick={handleDownloadSourceCode}>
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              <Paper
                elevation={0}
                sx={{
                  maxHeight: "600px",
                  overflow: "auto",
                  backgroundColor: "#282c34",
                  borderRadius: 2,
                  "&::-webkit-scrollbar": {
                    width: "10px",
                    height: "10px",
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderRadius: "5px",
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: "transparent",
                  },
                }}
              >
                <SyntaxHighlighter
                  language="solidity"
                  style={atomOneDark}
                  showLineNumbers
                  customStyle={{
                    margin: 0,
                    borderRadius: "8px",
                    padding: "20px",
                  }}
                >
                  {contract.sourceCode || "// No source code available"}
                </SyntaxHighlighter>
              </Paper>
            </Box>
          </TabPanel>

          {/* Vulnerabilities Tab */}
          {(contract.status === "analyzed" ||
            contract.status === "analyzing") && (
            <TabPanel value={selectedTab} index={1}>
              {!analysis || contract.status === "analyzing" ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : analysis.vulnerabilities &&
                analysis.vulnerabilities.length > 0 ? (
                <Grid container spacing={3}>
                  {/* Summary Card */}
                  <Grid item xs={12}>
                    <GlassCard glowColor="primary" sx={{ mb: 3, p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Vulnerability Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} sm={2}>
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <Typography variant="h4" color="error.main">
                              {
                                analysis.vulnerabilities.filter(
                                  (v) => v.severity === "Critical"
                                ).length
                              }
                            </Typography>
                            <Typography variant="body2">Critical</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <Typography variant="h4" color="error.light">
                              {
                                analysis.vulnerabilities.filter(
                                  (v) => v.severity === "High"
                                ).length
                              }
                            </Typography>
                            <Typography variant="body2">High</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <Typography variant="h4" color="warning.main">
                              {
                                analysis.vulnerabilities.filter(
                                  (v) => v.severity === "Medium"
                                ).length
                              }
                            </Typography>
                            <Typography variant="body2">Medium</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <Typography variant="h4" color="success.main">
                              {
                                analysis.vulnerabilities.filter(
                                  (v) => v.severity === "Low"
                                ).length
                              }
                            </Typography>
                            <Typography variant="body2">Low</Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Box sx={{ textAlign: "center", p: 1 }}>
                            <Typography variant="h4" color="info.main">
                              {
                                analysis.vulnerabilities.filter(
                                  (v) => v.severity === "Informational"
                                ).length
                              }
                            </Typography>
                            <Typography variant="body2">Info</Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </GlassCard>
                  </Grid>

                  {/* Vulnerability Details */}
                  {["Critical", "High", "Medium", "Low", "Informational"].map(
                    (severity) => {
                      const filteredVulns =
                        analysis.vulnerabilities?.filter(
                          (v) => v.severity === severity
                        ) || [];

                      if (filteredVulns.length === 0) return null;

                      return (
                        <Grid item xs={12} key={severity}>
                          <Typography variant="h6" gutterBottom>
                            {severity} Severity Issues ({filteredVulns.length})
                          </Typography>

                          {filteredVulns.map((vuln, index) => (
                            <Accordion
                              key={`${severity}-${index}`}
                              sx={{
                                mb: 2,
                                background: "rgba(30, 41, 59, 0.4)",
                                backdropFilter: "blur(10px)",
                                borderRadius: "8px !important",
                                overflow: "hidden",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                "&::before": {
                                  display: "none",
                                },
                              }}
                            >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                    width: "100%",
                                  }}
                                >
                                  <SeverityChip
                                    severity={vuln.severity as any}
                                  />
                                  <Typography sx={{ flex: 1 }}>
                                    {vuln.name}
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                  >
                                    Line {vuln.location.line}
                                  </Typography>
                                </Box>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Box sx={{ pl: 2 }}>
                                  <Typography gutterBottom>
                                    <strong>Description:</strong>{" "}
                                    {vuln.description}
                                  </Typography>
                                  <Typography gutterBottom>
                                    <strong>Impact:</strong> {vuln.details}
                                  </Typography>
                                  <Typography gutterBottom>
                                    <strong>Location:</strong> Line{" "}
                                    {vuln.location.line}
                                    {vuln.location.file &&
                                      ` in ${vuln.location.file}`}
                                  </Typography>
                                  <Box
                                    sx={{
                                      mt: 2,
                                      p: 2,
                                      bgcolor: "rgba(0, 0, 0, 0.2)",
                                      borderRadius: 1,
                                    }}
                                  >
                                    <Typography
                                      variant="subtitle2"
                                      color="primary.main"
                                      gutterBottom
                                    >
                                      Recommendation
                                    </Typography>
                                    <Typography>
                                      {vuln.recommendation}
                                    </Typography>
                                  </Box>
                                </Box>
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </Grid>
                      );
                    }
                  )}
                </Grid>
              ) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <CheckIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No vulnerabilities detected
                  </Typography>
                  <Typography color="text.secondary">
                    Our analysis did not find any security vulnerabilities in
                    your contract. While this is a good sign, we still recommend
                    a thorough manual review.
                  </Typography>
                </Box>
              )}
            </TabPanel>
          )}

          {/* Gas Optimization Tab */}
          {(contract.status === "analyzed" ||
            contract.status === "analyzing") && (
            <TabPanel value={selectedTab} index={2}>
              {!analysis || contract.status === "analyzing" ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : analysis.gasIssues && analysis.gasIssues.length > 0 ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <GlassCard glowColor="secondary" sx={{ mb: 3, p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Gas Optimization Summary
                      </Typography>
                      <Typography>
                        {analysis.gasIssues.length} optimization{" "}
                        {analysis.gasIssues.length === 1
                          ? "opportunity"
                          : "opportunities"}{" "}
                        identified
                      </Typography>
                    </GlassCard>
                  </Grid>

                  <Grid item xs={12}>
                    {analysis.gasIssues.map((issue, index) => (
                      <Accordion
                        key={index}
                        sx={{
                          mb: 2,
                          background: "rgba(30, 41, 59, 0.4)",
                          backdropFilter: "blur(10px)",
                          borderRadius: "8px !important",
                          overflow: "hidden",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          "&::before": {
                            display: "none",
                          },
                        }}
                      >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                              width: "100%",
                            }}
                          >
                            <GasIcon color="secondary" />
                            <Typography sx={{ flex: 1 }}>
                              {issue.description}
                            </Typography>
                            <Typography variant="body2" color="secondary.light">
                              {issue.gasSaved}
                            </Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <Box sx={{ pl: 2 }}>
                            <Typography gutterBottom>
                              <strong>Location:</strong> Line{" "}
                              {issue.location.line}
                              {issue.location.file &&
                                ` in ${issue.location.file}`}
                            </Typography>
                            <Typography gutterBottom>
                              <strong>Potential Gas Savings:</strong>{" "}
                              {issue.gasSaved}
                            </Typography>
                            <Box
                              sx={{
                                mt: 2,
                                p: 2,
                                bgcolor: "rgba(0, 0, 0, 0.2)",
                                borderRadius: 1,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                color="secondary.main"
                                gutterBottom
                              >
                                Recommendation
                              </Typography>
                              <Typography>{issue.recommendation}</Typography>
                            </Box>
                          </Box>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Grid>
                </Grid>
              ) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <CheckIcon color="success" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No gas optimization issues found
                  </Typography>
                  <Typography color="text.secondary">
                    Your contract appears to be well-optimized for gas usage.
                  </Typography>
                </Box>
              )}
            </TabPanel>
          )}

          {/* Compliance Tab */}
          {(contract.status === "analyzed" ||
            contract.status === "analyzing") && (
            <TabPanel value={selectedTab} index={3}>
              {!analysis || contract.status === "analyzing" ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : analysis.complianceResults &&
                Object.keys(analysis.complianceResults).length > 0 ? (
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <GlassCard glowColor="tertiary" sx={{ mb: 3, p: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Compliance Summary
                      </Typography>
                      <Grid container spacing={2}>
                        {Object.entries(analysis.complianceResults).map(
                          ([standard, result]) => (
                            <Grid item xs={12} sm={6} md={4} key={standard}>
                              <Box
                                sx={{
                                  border: "1px solid",
                                  borderColor: result.compliant
                                    ? "success.main"
                                    : "error.main",
                                  borderRadius: 2,
                                  p: 2,
                                  textAlign: "center",
                                }}
                              >
                                <Typography variant="h6" gutterBottom>
                                  {standard.toUpperCase()}
                                </Typography>
                                <Chip
                                  label={
                                    result.compliant
                                      ? "Compliant"
                                      : "Non-compliant"
                                  }
                                  color={result.compliant ? "success" : "error"}
                                  sx={{ mb: 1 }}
                                />
                                {!result.compliant &&
                                  result.missingRequirements.length > 0 && (
                                    <Box sx={{ mt: 2, textAlign: "left" }}>
                                      <Typography
                                        variant="subtitle2"
                                        gutterBottom
                                      >
                                        Missing Requirements:
                                      </Typography>
                                      <ul
                                        style={{
                                          margin: 0,
                                          paddingLeft: "20px",
                                        }}
                                      >
                                        {result.missingRequirements
                                          .slice(0, 3)
                                          .map((req, i) => (
                                            <li key={i}>
                                              <Typography
                                                variant="body2"
                                                color="text.secondary"
                                              >
                                                {req}
                                              </Typography>
                                            </li>
                                          ))}
                                        {result.missingRequirements.length >
                                          3 && (
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                          >
                                            And{" "}
                                            {result.missingRequirements.length -
                                              3}{" "}
                                            more...
                                          </Typography>
                                        )}
                                      </ul>
                                    </Box>
                                  )}
                              </Box>
                            </Grid>
                          )
                        )}
                      </Grid>
                    </GlassCard>
                  </Grid>

                  {/* Compliance Details */}
                  {Object.entries(analysis.complianceResults).map(
                    ([standard, result]) => {
                      if (result.compliant) return null;

                      return (
                        <Grid item xs={12} key={standard}>
                          <Accordion
                            sx={{
                              mb: 2,
                              background: "rgba(30, 41, 59, 0.4)",
                              backdropFilter: "blur(10px)",
                              borderRadius: "8px !important",
                              overflow: "hidden",
                              border: "1px solid rgba(255, 255, 255, 0.1)",
                              "&::before": {
                                display: "none",
                              },
                            }}
                          >
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 2,
                                  width: "100%",
                                }}
                              >
                                <VerifiedUserIcon color="warning" />
                                <Typography sx={{ flex: 1 }}>
                                  {standard.toUpperCase()} Compliance Issues
                                </Typography>
                                <Chip
                                  label="Non-compliant"
                                  color="error"
                                  size="small"
                                />
                              </Box>
                            </AccordionSummary>
                            <AccordionDetails>
                              <Box sx={{ pl: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Missing Requirements:
                                </Typography>
                                <ul>
                                  {result.missingRequirements.map((req, i) => (
                                    <li key={i}>
                                      <Typography gutterBottom>
                                        {req}
                                      </Typography>
                                    </li>
                                  ))}
                                </ul>

                                {result.recommendations &&
                                  result.recommendations.length > 0 && (
                                    <Box
                                      sx={{
                                        mt: 2,
                                        p: 2,
                                        bgcolor: "rgba(0, 0, 0, 0.2)",
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Typography
                                        variant="subtitle2"
                                        color="warning.main"
                                        gutterBottom
                                      >
                                        Recommendations
                                      </Typography>
                                      <ul style={{ marginTop: 0 }}>
                                        {result.recommendations.map(
                                          (rec, i) => (
                                            <li key={i}>
                                              <Typography>{rec}</Typography>
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    </Box>
                                  )}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        </Grid>
                      );
                    }
                  )}
                </Grid>
              ) : (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <InfoIcon color="info" sx={{ fontSize: 48, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No compliance standards detected
                  </Typography>
                  <Typography color="text.secondary">
                    No standard compliance checks were performed for this
                    contract. Your contract may not implement any recognized
                    token standards.
                  </Typography>
                </Box>
              )}
            </TabPanel>
          )}
        </GlassCard>
      </AnimatedElement>

      {/* Recommendations Section */}
      {analysis &&
        analysis.recommendations &&
        analysis.recommendations.length > 0 && (
          <AnimatedElement animation="slideUp" delay={0.2}>
            <GlassCard sx={{ mt: 4, p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <ul>
                {analysis.recommendations.map((rec, index) => (
                  <li key={index}>
                    <Typography sx={{ mb: 1 }}>{rec}</Typography>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </AnimatedElement>
        )}

      {/* Actions Footer */}
      <AnimatedElement animation="slideUp" delay={0.3}>
        <Box sx={{ mt: 4, display: "flex", justifyContent: "space-between" }}>
          <Button variant="outlined" onClick={() => navigate("/contracts")}>
            Back to Contracts
          </Button>

          {contract.status === "analyzed" && (
            <GradientButton
              variant="contained"
              gradient="secondary"
              startIcon={<DescriptionIcon />}
              onClick={handleGenerateReport}
            >
              Generate Report
            </GradientButton>
          )}
        </Box>
      </AnimatedElement>
    </Box>
  );
};

export default ContractDetailPage;
