import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  CardContent,
  Button,
  useTheme,
  LinearProgress,
  Chip,
  Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Description as DescriptionIcon,
  BugReport as BugIcon,
  ShieldOutlined as ShieldIcon,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import AnimatedElement from "../../components/common/AnimatedElement";
import { useAuth } from "../../context/AuthContext";
import { ContractService, Contract } from "../../services/api.service";

// Stats card component
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: "primary" | "secondary" | "tertiary" | "accent";
  subtitle?: string;
  index?: number;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  subtitle,
  index = 0,
}) => {
  return (
    <AnimatedElement animation="scale" delay={0.1 + index * 0.1}>
      <GlassCard glowColor={color} borderGlow sx={{ height: "100%" }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Avatar
              sx={{
                bgcolor: `${color}.main`,
                color: `${color}.contrastText`,
                mr: 2,
                width: 48,
                height: 48,
              }}
            >
              {icon}
            </Avatar>
            <Box>
              <Typography variant="h4" component="div" fontWeight="bold">
                {value}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {title}
              </Typography>
            </Box>
          </Box>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </CardContent>
      </GlassCard>
    </AnimatedElement>
  );
};

// Recent contract card component
interface RecentContractCardProps {
  contract: Contract;
  index: number;
}

const RecentContractCard: React.FC<RecentContractCardProps> = ({
  contract,
  index,
}) => {
  const navigate = useNavigate();

  // Status colors and labels
  const statusColors = {
    uploaded: "info",
    analyzing: "warning",
    analyzed: "success",
    failed: "error",
  };

  const statusLabels = {
    uploaded: "Uploaded",
    analyzing: "Analyzing",
    analyzed: "Analyzed",
    failed: "Failed",
  };

  return (
    <AnimatedElement animation="slideUp" delay={0.1 + index * 0.1}>
      <GlassCard
        hoverEffect
        sx={{ cursor: "pointer" }}
        onClick={() => navigate(`/contracts/${contract.id}`)}
      >
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              component="div"
              fontWeight="bold"
              gutterBottom
            >
              {contract.name}
            </Typography>
            <Chip
              label={statusLabels[contract.status]}
              color={statusColors[contract.status] as any}
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

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mt: 2,
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Uploaded: {new Date(contract.uploadedAt).toLocaleDateString()}
            </Typography>

            {contract.status === "analyzing" && (
              <Box sx={{ width: "100%", mt: 1 }}>
                <LinearProgress
                  color="warning"
                  variant={contract.progress ? "determinate" : "indeterminate"}
                  value={contract.progress || 0}
                />
                {contract.progress && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", textAlign: "right", mt: 0.5 }}
                  >
                    {Math.round(contract.progress)}% complete
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </GlassCard>
    </AnimatedElement>
  );
};

const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContracts: 0,
    analyzedContracts: 0,
    totalVulnerabilities: 0,
    highRiskContracts: 0,
  });

  // Function to fetch contracts data
  const fetchContracts = async () => {
    try {
      const result = await ContractService.getContracts(1, 5);
      setContracts(result.data);

      // Calculate stats from contracts
      const analyzedContracts = result.data.filter(
        (c) => c.status === "analyzed"
      ).length;

      // In a real app, you would fetch these from the API
      setStats({
        totalContracts: result.data.length,
        analyzedContracts,
        totalVulnerabilities: 12, // This should come from the backend
        highRiskContracts: 2, // This should come from the backend
      });

      return result.data;
    } catch (error) {
      console.error("Error fetching contracts:", error);
      return [];
    }
  };

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await fetchContracts();
      setLoading(false);
    };

    loadInitialData();
  }, []);

  // Polling for contracts that are being analyzed
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollAnalyzingContracts = () => {
      const hasAnalyzingContracts = contracts.some(
        (c) => c.status === "analyzing"
      );

      if (hasAnalyzingContracts) {
        intervalId = setInterval(async () => {
          const updatedContracts = await fetchContracts();

          // If no contracts are analyzing anymore, clear the interval
          if (!updatedContracts.some((c) => c.status === "analyzing")) {
            clearInterval(intervalId);
          }
        }, 5000); // Poll every 5 seconds
      }

      return () => {
        if (intervalId) clearInterval(intervalId);
      };
    };

    return pollAnalyzingContracts();
  }, [contracts]);

  // Fetch contracts data
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const result = await ContractService.getContracts(1, 5);
        setContracts(result.data);

        // Calculate stats from contracts
        const analyzedContracts = result.data.filter(
          (c) => c.status === "analyzed"
        ).length;

        // Mock data for stats - in a real app, you would fetch this from the API
        setStats({
          totalContracts: result.data.length,
          analyzedContracts,
          totalVulnerabilities: 12, // Mock data
          highRiskContracts: 2, // Mock data
        });
      } catch (error) {
        console.error("Error fetching contracts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Mock data for vulnerability chart
  const vulnerabilityData = [
    { name: "Reentrancy", count: 3 },
    { name: "Overflow", count: 2 },
    { name: "Access Control", count: 4 },
    { name: "Gas Issues", count: 7 },
    { name: "Unchecked Call", count: 1 },
  ];

  // Mock data for risk distribution
  const riskData = [
    { name: "Critical", value: 1 },
    { name: "High", value: 2 },
    { name: "Medium", value: 5 },
    { name: "Low", value: 8 },
    { name: "Info", value: 12 },
  ];

  // Colors for risk chart
  const RISK_COLORS = [
    "#ef4444", // Critical - Red
    "#f97316", // High - Orange
    "#f59e0b", // Medium - Amber
    "#10b981", // Low - Green
    "#3b82f6", // Info - Blue
  ];

  return (
    <Box>
      {/* Welcome Header */}
      <AnimatedElement animation="slideUp">
        <Box sx={{ mb: 6 }}>
          <Typography
            variant="h3"
            component="h1"
            fontWeight="bold"
            gutterBottom
          >
            Welcome{user?.name ? `, ${user.name}` : ""}
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Your smart contract security dashboard overview
          </Typography>
        </Box>
      </AnimatedElement>

      {/* Quick Actions */}
      <AnimatedElement animation="slideUp" delay={0.1}>
        <Box sx={{ mb: 6, display: "flex", gap: 2, flexWrap: "wrap" }}>
          <GradientButton
            variant="contained"
            gradient="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate("/contracts/upload")}
          >
            Upload Contract
          </GradientButton>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<AssignmentIcon />}
            onClick={() => navigate("/contracts")}
          >
            View All Contracts
          </Button>

          <Button
            variant="outlined"
            color="secondary"
            startIcon={<DescriptionIcon />}
            onClick={() => navigate("/reports")}
          >
            View Reports
          </Button>
        </Box>
      </AnimatedElement>

      {/* Stats Cards */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Contracts"
            value={stats.totalContracts}
            icon={<ShieldIcon />}
            color="primary"
            index={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Analyzed Contracts"
            value={stats.analyzedContracts}
            icon={<AssignmentIcon />}
            color="secondary"
            index={1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Vulnerabilities"
            value={stats.totalVulnerabilities}
            icon={<BugIcon />}
            color="tertiary"
            index={2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="High Risk Contracts"
            value={stats.highRiskContracts}
            icon={<ShieldIcon />}
            color="accent"
            index={3}
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={4} sx={{ mb: 6 }}>
        <Grid item xs={12} md={8}>
          <AnimatedElement animation="slideUp">
            <GlassCard sx={{ height: "100%", p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 2 }}>
                Vulnerability Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={vulnerabilityData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.1)"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: theme.palette.text.secondary }}
                  />
                  <YAxis tick={{ fill: theme.palette.text.secondary }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30, 41, 59, 0.9)",
                      border: "none",
                      borderRadius: 8,
                      color: theme.palette.text.primary,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Count"
                    fill={theme.palette.primary.main}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </GlassCard>
          </AnimatedElement>
        </Grid>

        <Grid item xs={12} md={4}>
          <AnimatedElement animation="slideUp" delay={0.1}>
            <GlassCard sx={{ height: "100%", p: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ px: 2, pt: 2 }}>
                Risk Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={riskData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {riskData.map((_entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={RISK_COLORS[index % RISK_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(30, 41, 59, 0.9)",
                      border: "none",
                      borderRadius: 8,
                      color: theme.palette.text.primary,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </GlassCard>
          </AnimatedElement>
        </Grid>
      </Grid>

      {/* Recent Contracts */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <AnimatedElement animation="slideUp">
            <Typography variant="h5" component="h2" fontWeight="bold">
              Recent Contracts
            </Typography>
          </AnimatedElement>

          <AnimatedElement animation="slideUp" delay={0.1}>
            <Button
              color="primary"
              onClick={() => navigate("/contracts")}
              endIcon={
                <motion.div
                  whileHover={{ x: 5 }}
                  transition={{ duration: 0.2 }}
                >
                  →
                </motion.div>
              }
            >
              View All
            </Button>
          </AnimatedElement>
        </Box>

        {loading ? (
          <LinearProgress />
        ) : contracts.length > 0 ? (
          <Grid container spacing={3}>
            {contracts.map((contract, index) => (
              <Grid item xs={12} md={6} key={contract.id}>
                <RecentContractCard contract={contract} index={index} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <AnimatedElement animation="fadeIn">
            <GlassCard sx={{ p: 4, textAlign: "center" }}>
              <Typography gutterBottom>No contracts found</Typography>
              <GradientButton
                variant="contained"
                gradient="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate("/contracts/upload")}
                sx={{ mt: 2 }}
              >
                Upload Your First Contract
              </GradientButton>
            </GlassCard>
          </AnimatedElement>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;
