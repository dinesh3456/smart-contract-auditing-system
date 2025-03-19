import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Pagination,
  LinearProgress,
  Divider,
  CardContent,
  CardActions,
  Alert,
  Stack,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  PictureAsPdf as PdfIcon,
  Code as MarkdownIcon,
  Language as HtmlIcon,
  Storage as JsonIcon,
  Article as ReportIcon,
  MoreVert as MoreVertIcon,
  Visibility as ViewIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import AnimatedElement from "../../components/common/AnimatedElement";
import {
  ReportService,
  ContractService,
  Contract,
} from "../../services/api.service";

// Format chip component
interface FormatChipProps {
  format: "pdf" | "html" | "markdown" | "json";
  onClick?: () => void;
}

const FormatChip: React.FC<FormatChipProps> = ({ format, onClick }) => {
  const formatConfig = {
    pdf: { label: "PDF", icon: <PdfIcon fontSize="small" />, color: "#F40F02" },
    html: {
      label: "HTML",
      icon: <HtmlIcon fontSize="small" />,
      color: "#E96228",
    },
    markdown: {
      label: "Markdown",
      icon: <MarkdownIcon fontSize="small" />,
      color: "#08979D",
    },
    json: {
      label: "JSON",
      icon: <JsonIcon fontSize="small" />,
      color: "#F5BB12",
    },
  };

  const config = formatConfig[format];

  return (
    <Chip
      label={config.label}
      icon={config.icon}
      onClick={onClick}
      sx={{
        "& .MuiChip-icon": {
          color: config.color,
        },
      }}
    />
  );
};

// Report card component
interface ReportCardProps {
  contract: Contract;
  formats: ("pdf" | "html" | "markdown" | "json")[];
  summary: string;
  generatedAt: string;
  onView: (id: string) => void;
  onDownload: (
    id: string,
    format: "pdf" | "html" | "markdown" | "json"
  ) => void;
  index: number;
}

const ReportCard: React.FC<ReportCardProps> = ({
  contract,
  formats,
  summary,
  generatedAt,
  onView,
  onDownload,
  index,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const formatLabels = {
    pdf: "Download PDF",
    html: "Download HTML",
    markdown: "Download Markdown",
    json: "Download JSON",
  };

  // Extract risk level from summary
  const getRiskLevel = ():
    | "Critical"
    | "High"
    | "Medium"
    | "Low"
    | "Informational" => {
    if (summary.includes("Risk: Critical")) return "Critical";
    if (summary.includes("Risk: High")) return "High";
    if (summary.includes("Risk: Medium")) return "Medium";
    if (summary.includes("Risk: Low")) return "Low";
    return "Informational";
  };

  const riskLevel = getRiskLevel();
  const riskColors = {
    Critical: "error",
    High: "error",
    Medium: "warning",
    Low: "success",
    Informational: "info",
  };

  return (
    <AnimatedElement animation="slideUp" delay={0.1 + index * 0.05}>
      <GlassCard>
        <CardContent sx={{ pb: 1 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="h2" fontWeight="bold">
              {contract.name}
            </Typography>

            <Chip
              label={`Risk: ${riskLevel}`}
              color={riskColors[riskLevel] as any}
              size="small"
            />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Version: {contract.version}
          </Typography>

          {contract.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              gutterBottom
            >
              {contract.description}
            </Typography>
          )}

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Report generated: {new Date(generatedAt).toLocaleDateString()}
          </Typography>

          <Divider sx={{ mb: 2 }} />

          <Typography variant="body2" gutterBottom>
            {summary}
          </Typography>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
            {formats.map((format) => (
              <FormatChip
                key={format}
                format={format}
                onClick={() => onDownload(contract.id, format)}
              />
            ))}
          </Stack>

          <Box sx={{ ml: "auto" }}>
            <IconButton onClick={() => onView(contract.id)}>
              <ViewIcon />
            </IconButton>

            <IconButton onClick={handleOpenMenu}>
              <MoreVertIcon />
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleCloseMenu}
            MenuListProps={{
              "aria-labelledby": "report-actions",
            }}
          >
            <MenuItem
              onClick={() => {
                onView(contract.id);
                handleCloseMenu();
              }}
            >
              <ViewIcon fontSize="small" sx={{ mr: 1 }} />
              View Details
            </MenuItem>

            <Divider />

            {formats.map((format) => (
              <MenuItem
                key={format}
                onClick={() => {
                  onDownload(contract.id, format);
                  handleCloseMenu();
                }}
              >
                {format === "pdf" && (
                  <PdfIcon fontSize="small" sx={{ mr: 1 }} />
                )}
                {format === "html" && (
                  <HtmlIcon fontSize="small" sx={{ mr: 1 }} />
                )}
                {format === "markdown" && (
                  <MarkdownIcon fontSize="small" sx={{ mr: 1 }} />
                )}
                {format === "json" && (
                  <JsonIcon fontSize="small" sx={{ mr: 1 }} />
                )}
                {formatLabels[format]}
              </MenuItem>
            ))}
          </Menu>
        </CardActions>
      </GlassCard>
    </AnimatedElement>
  );
};

// Single report view component
interface SingleReportViewProps {
  contractId: string;
  onBack: () => void;
}

const SingleReportView: React.FC<SingleReportViewProps> = ({
  contractId,
  onBack,
}) => {
  const [contract, setContract] = useState<Contract | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch contract details
        const contractData = await ContractService.getContract(contractId);
        setContract(contractData);

        // Fetch report data
        const reportData = await ReportService.getReport(contractId);
        setReport(reportData);

        setError("");
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError("Failed to load report. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [contractId]);

  const handleDownload = (format: "pdf" | "html" | "markdown" | "json") => {
    const url = ReportService.getReportDownloadUrl(contractId, format);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <Box sx={{ my: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: "center" }}>
          Loading report...
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
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
        >
          Back to Reports
        </Button>
      </Box>
    );
  }

  if (!contract || !report) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Report not found
        </Alert>
        <Button
          variant="outlined"
          onClick={onBack}
          startIcon={<ArrowBackIcon />}
        >
          Back to Reports
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <AnimatedElement animation="slideUp">
        <Box sx={{ mb: 4 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mb: 2 }}
          >
            Back to Reports
          </Button>

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

              {contract.description && (
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  {contract.description}
                </Typography>
              )}

              <Typography variant="body2" color="text.secondary">
                Report generated:{" "}
                {new Date(report.generatedAt).toLocaleDateString()}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <GradientButton
                variant="contained"
                gradient="primary"
                startIcon={<ShareIcon />}
                onClick={() =>
                  navigator.clipboard.writeText(window.location.href)
                }
              >
                Share Report
              </GradientButton>

              <Button
                variant="outlined"
                startIcon={<ViewIcon />}
                onClick={() =>
                  window.open(`/contracts/${contractId}`, "_blank")
                }
              >
                View Contract
              </Button>
            </Box>
          </Box>
        </Box>
      </AnimatedElement>

      <AnimatedElement animation="slideUp" delay={0.1}>
        <GlassCard sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Report Summary
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography>{report.summary}</Typography>
        </GlassCard>
      </AnimatedElement>

      <AnimatedElement animation="slideUp" delay={0.2}>
        <GlassCard sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Available Formats
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {report.formats.includes("pdf") && (
              <GradientButton
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={() => handleDownload("pdf")}
              >
                Download PDF
              </GradientButton>
            )}

            {report.formats.includes("html") && (
              <Button
                variant="outlined"
                startIcon={<HtmlIcon />}
                onClick={() => handleDownload("html")}
              >
                Download HTML
              </Button>
            )}

            {report.formats.includes("markdown") && (
              <Button
                variant="outlined"
                startIcon={<MarkdownIcon />}
                onClick={() => handleDownload("markdown")}
              >
                Download Markdown
              </Button>
            )}

            {report.formats.includes("json") && (
              <Button
                variant="outlined"
                startIcon={<JsonIcon />}
                onClick={() => handleDownload("json")}
              >
                Download JSON
              </Button>
            )}
          </Box>
        </GlassCard>
      </AnimatedElement>

      <AnimatedElement animation="slideUp" delay={0.3}>
        <GlassCard sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Want to share this report?
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography gutterBottom>
            This audit report URL can be shared with stakeholders:
          </Typography>
          <Box
            sx={{
              p: 2,
              bgcolor: "rgba(0,0,0,0.2)",
              borderRadius: 1,
              mb: 2,
              overflowX: "auto",
            }}
          >
            <Typography fontFamily="monospace">
              {window.location.href}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigator.clipboard.writeText(window.location.href)}
          >
            Copy Link
          </Button>
        </GlassCard>
      </AnimatedElement>
    </Box>
  );
};

// Main reports page component
const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const [reports, setReports] = useState<any[]>([]);
  const [contracts, setContracts] = useState<Record<string, Contract>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedRisk, setSelectedRisk] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const reportsPerPage = 6;

  // Fetch reports data
  useEffect(() => {
    if (id) return; // Skip fetching list if viewing single report

    const fetchReports = async () => {
      try {
        setLoading(true);

        // In a real implementation, you would have an API to fetch all reports
        // For this example, we'll fetch analyzed contracts and treat them as reports
        const contractsResult = await ContractService.getContracts();
        const analyzedContracts = contractsResult.data.filter(
          (contract) => contract.status === "analyzed"
        );

        // Create a map of contracts by ID for easy lookup
        const contractsMap: Record<string, Contract> = {};
        analyzedContracts.forEach((contract) => {
          contractsMap[contract.id] = contract;
        });
        setContracts(contractsMap);

        // Mock fetching reports (in a real app, you would have a proper API for this)
        const mockReports = analyzedContracts.map((contract) => ({
          id: contract.id,
          contractId: contract.id,
          formats: ["pdf", "html", "markdown", "json"],
          generatedAt: contract.lastAnalyzed || new Date().toISOString(),
          summary:
            `Overall Risk: ${
              ["Low", "Medium", "High", "Critical"][
                Math.floor(Math.random() * 4)
              ]
            }. ` +
            `Vulnerabilities: ${Math.floor(
              Math.random() * 3
            )} Critical, ${Math.floor(Math.random() * 5)} High, ${Math.floor(
              Math.random() * 8
            )} Medium. ` +
            `Gas Issues: ${Math.floor(Math.random() * 10)}. ` +
            `Compliance: ERC20: ${
              Math.random() > 0.5 ? "Compliant" : "Non-compliant"
            }, ERC721: ${
              Math.random() > 0.5 ? "Compliant" : "Non-compliant"
            }. ` +
            `Anomaly Detection: ${
              Math.random() > 0.7 ? "Anomalous" : "No anomalies detected"
            }.`,
        }));

        setReports(mockReports);
        setError("");
      } catch (err) {
        console.error("Error fetching reports:", err);
        setError("Failed to load reports. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [id]);

  // Filter and search functionality
  const filteredReports = reports.filter((report) => {
    const contract = contracts[report.contractId];
    if (!contract) return false;

    const matchesSearch =
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.description &&
        contract.description.toLowerCase().includes(searchTerm.toLowerCase()));

    // Risk level filtering
    let matchesRisk = true;
    if (selectedRisk) {
      matchesRisk = report.summary.includes(`Risk: ${selectedRisk}`);
    }

    return matchesSearch && matchesRisk;
  });

  // Pagination
  const pageCount = Math.ceil(filteredReports.length / reportsPerPage);
  const displayedReports = filteredReports.slice(
    (page - 1) * reportsPerPage,
    page * reportsPerPage
  );

  // Handle filter menu
  const openFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const closeFilterMenu = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (risk: string | null) => {
    setSelectedRisk(risk);
    closeFilterMenu();
    setPage(1); // Reset to first page when filtering
  };

  // Handle view report
  const handleViewReport = (contractId: string) => {
    navigate(`/reports/${contractId}`);
  };

  // Handle download report
  const handleDownloadReport = (
    contractId: string,
    format: "pdf" | "html" | "markdown" | "json"
  ) => {
    const url = ReportService.getReportDownloadUrl(contractId, format);
    window.open(url, "_blank");
  };

  // Handle back button from single report view
  const handleBackToReports = () => {
    navigate("/reports");
  };

  // If viewing a single report
  if (id) {
    return <SingleReportView contractId={id} onBack={handleBackToReports} />;
  }

  return (
    <Box>
      <AnimatedElement animation="fadeIn">
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 4,
          }}
        >
          <Typography variant="h4" component="h1" fontWeight="bold">
            Audit Reports
          </Typography>
        </Box>
      </AnimatedElement>

      <AnimatedElement animation="slideUp" delay={0.1}>
        <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search reports..."
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={openFilterMenu}
            size="small"
          >
            {selectedRisk ? `Risk: ${selectedRisk}` : "Filter by Risk"}
          </Button>

          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={closeFilterMenu}
          >
            <MenuItem onClick={() => handleFilterSelect(null)}>
              All Risks
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect("Critical")}>
              Critical
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect("High")}>High</MenuItem>
            <MenuItem onClick={() => handleFilterSelect("Medium")}>
              Medium
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect("Low")}>Low</MenuItem>
          </Menu>
        </Box>
      </AnimatedElement>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {!loading && displayedReports.length === 0 && (
        <AnimatedElement animation="fadeIn">
          <GlassCard>
            <Box sx={{ p: 4, textAlign: "center" }}>
              <ReportIcon sx={{ fontSize: 48, mb: 2, opacity: 0.7 }} />
              <Typography variant="h6" gutterBottom>
                No reports found
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {searchTerm || selectedRisk
                  ? "Try adjusting your search or filters"
                  : "Analyze a contract to generate an audit report"}
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/contracts")}
                sx={{ mt: 2 }}
              >
                View Contracts
              </Button>
            </Box>
          </GlassCard>
        </AnimatedElement>
      )}

      <Grid container spacing={3}>
        {displayedReports.map((report, index) => {
          const contract = contracts[report.contractId];
          if (!contract) return null;

          return (
            <Grid item xs={12} md={6} key={report.id}>
              <ReportCard
                contract={contract}
                formats={report.formats}
                summary={report.summary}
                generatedAt={report.generatedAt}
                onView={handleViewReport}
                onDownload={handleDownloadReport}
                index={index}
              />
            </Grid>
          );
        })}
      </Grid>

      {pageCount > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default ReportsPage;
