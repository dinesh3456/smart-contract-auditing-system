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
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Description as DescriptionIcon,
  MoreVert as MoreVertIcon,
  PlayArrow as StartIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import AnimatedElement from "../../components/common/AnimatedElement";
import { ContractService, Contract } from "../../services/api.service";

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

// Contract card component
interface ContractCardProps {
  contract: Contract;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  onReport: (id: string) => void;
  onStartAnalysis?: (id: string) => void;
  index: number;
}

const ContractCard: React.FC<ContractCardProps> = ({
  contract,
  onView,
  onDelete,
  onReport,
  onStartAnalysis,
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

  return (
    <AnimatedElement animation="slideUp" delay={0.1 + index * 0.05}>
      <GlassCard hoverEffect>
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" component="h2" fontWeight="bold">
              {contract.name}
            </Typography>
            <StatusChip status={contract.status} />
          </Box>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            Version: {contract.version}
          </Typography>

          {contract.description && (
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {contract.description}
            </Typography>
          )}

          <Typography
            variant="caption"
            display="block"
            color="text.secondary"
            gutterBottom
          >
            Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
          </Typography>

          {contract.lastAnalyzed && (
            <Typography
              variant="caption"
              display="block"
              color="text.secondary"
              gutterBottom
            >
              Last Analyzed:{" "}
              {new Date(contract.lastAnalyzed).toLocaleDateString()}
            </Typography>
          )}

          {contract.status === "analyzing" && (
            <Box sx={{ my: 2 }}>
              <LinearProgress color="warning" />
            </Box>
          )}

          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Tooltip title="View Contract">
                <IconButton onClick={() => onView(contract.id)} sx={{ mr: 1 }}>
                  <ViewIcon />
                </IconButton>
              </Tooltip>

              {contract.status === "analyzed" && (
                <Tooltip title="View Report">
                  <IconButton
                    onClick={() => onReport(contract.id)}
                    sx={{ mr: 1 }}
                    color="primary"
                  >
                    <DescriptionIcon />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Delete Contract">
                <IconButton onClick={() => onDelete(contract.id)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>

            <IconButton onClick={handleOpenMenu}>
              <MoreVertIcon />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleCloseMenu}
              MenuListProps={{
                "aria-labelledby": "more-button",
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

              {contract.status === "analyzed" && (
                <MenuItem
                  onClick={() => {
                    onReport(contract.id);
                    handleCloseMenu();
                  }}
                >
                  <DescriptionIcon fontSize="small" sx={{ mr: 1 }} />
                  View Report
                </MenuItem>
              )}

              {contract.status === "uploaded" && (
                <MenuItem
                  onClick={() => {
                    if (onStartAnalysis) onStartAnalysis(contract.id);
                    handleCloseMenu();
                  }}
                >
                  <StartIcon fontSize="small" sx={{ mr: 1 }} />
                  Start Analysis
                </MenuItem>
              )}

              <MenuItem
                onClick={() => {
                  onDelete(contract.id);
                  handleCloseMenu();
                }}
              >
                <DeleteIcon fontSize="small" sx={{ mr: 1 }} color="error" />
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </GlassCard>
    </AnimatedElement>
  );
};

const ContractsPage: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const contractsPerPage = 6;
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  const fetchContractsWithRetry = async () => {
    try {
      setLoading(true);
      const result = await ContractService.getContracts();
      setContracts(result.data);
      setError("");
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error(
        `Error fetching contracts (attempt ${retryCount + 1}/${MAX_RETRIES}):`,
        err
      );

      if (retryCount < MAX_RETRIES - 1) {
        // Retry with exponential backoff
        setRetryCount((prev) => prev + 1);
        setTimeout(() => {
          fetchContractsWithRetry();
        }, 1000 * Math.pow(2, retryCount)); // 1s, 2s, 4s, etc.
      } else {
        setError(
          "Failed to load contracts after multiple attempts. Please try again later."
        );
      }
    } finally {
      if (retryCount >= MAX_RETRIES - 1) {
        setLoading(false);
      }
    }
  };

  // Use this in your initial useEffect
  useEffect(() => {
    fetchContractsWithRetry();
  }, []);

  // Fix the polling in ContractsPage
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await ContractService.getContracts();

        if (!result || !result.data) {
          throw new Error("Invalid response format from server");
        }

        setContracts(result.data);
      } catch (err) {
        console.error("Error fetching contracts:", err);
        setError("Failed to load contracts. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Filter and search functionality
  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.description &&
        contract.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = !selectedFilter || contract.status === selectedFilter;

    return matchesSearch && matchesFilter;
  });

  // Pagination
  const pageCount = Math.ceil(filteredContracts.length / contractsPerPage);
  const displayedContracts = filteredContracts.slice(
    (page - 1) * contractsPerPage,
    page * contractsPerPage
  );

  // Handle filter menu
  const openFilterMenu = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const closeFilterMenu = () => {
    setFilterAnchorEl(null);
  };

  const handleFilterSelect = (filter: string | null) => {
    setSelectedFilter(filter);
    closeFilterMenu();
    setPage(1); // Reset to first page when filtering
  };

  // Handle view contract
  const handleViewContract = (id: string) => {
    navigate(`/contracts/${id}`);
  };

  // Handle delete contract
  const handleDeleteContract = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this contract?")) {
      try {
        await ContractService.deleteContract(id);
        setContracts(contracts.filter((contract) => contract.id !== id));
      } catch (err) {
        setError("Failed to delete contract. Please try again.");
        console.error(err);
      }
    }
  };

  // Handle view report
  const handleViewReport = (id: string) => {
    navigate(`/reports/${id}`);
  };

  // Handle start analysis
  const handleStartAnalysis = async (id: string) => {
    try {
      setLoading(true);
      await ContractService.analyzeContract(id);
      // Refresh the contract data
      const result = await ContractService.getContracts();
      setContracts(result.data);
    } catch (err) {
      setError("Failed to start analysis. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ py: 4, px: 2 }}>
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
            Smart Contracts
          </Typography>

          <GradientButton
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/contracts/upload")}
          >
            Upload Contract
          </GradientButton>
        </Box>
      </AnimatedElement>

      <AnimatedElement animation="slideUp" delay={0.1}>
        <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            placeholder="Search contracts..."
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
            {selectedFilter ? `Filter: ${selectedFilter}` : "Filter"}
          </Button>

          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={closeFilterMenu}
          >
            <MenuItem onClick={() => handleFilterSelect(null)}>All</MenuItem>
            <MenuItem onClick={() => handleFilterSelect("uploaded")}>
              Uploaded
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect("analyzing")}>
              Analyzing
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect("analyzed")}>
              Analyzed
            </MenuItem>
            <MenuItem onClick={() => handleFilterSelect("failed")}>
              Failed
            </MenuItem>
          </Menu>
        </Box>
      </AnimatedElement>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => {
                setRetryCount(0);
                fetchContractsWithRetry();
              }}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading && <LinearProgress sx={{ mb: 3 }} />}

      {!loading && displayedContracts.length === 0 && (
        <AnimatedElement animation="fadeIn">
          <GlassCard>
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                No contracts found
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {searchTerm || selectedFilter
                  ? "Try adjusting your search or filters"
                  : "Upload a smart contract to get started"}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate("/contracts/upload")}
                sx={{ mt: 2 }}
              >
                Upload Contract
              </Button>
            </Box>
          </GlassCard>
        </AnimatedElement>
      )}

      <Grid container spacing={3}>
        {displayedContracts.map((contract, index) => (
          <Grid item xs={12} sm={6} md={4} key={contract.id}>
            <ContractCard
              contract={contract}
              onView={handleViewContract}
              onDelete={handleDeleteContract}
              onReport={handleViewReport}
              onStartAnalysis={handleStartAnalysis}
              index={index}
            />
          </Grid>
        ))}
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

export default ContractsPage;
