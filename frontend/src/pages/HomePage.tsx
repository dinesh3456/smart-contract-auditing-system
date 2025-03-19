import React, { useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Grid,
  Container,
  useTheme,
  Stack,
  useMediaQuery,
} from "@mui/material";
import {
  Security,
  BugReport,
  Speed,
  QueryStats,
  Assignment,
} from "@mui/icons-material";
import { motion, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";

import GradientButton from "../components/common/GradientButton";
import GlassCard from "../components/common/GlassCard";
import AnimatedElement from "../components/common/AnimatedElement";
import { useAuth } from "../context/AuthContext";

// Feature card component
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "primary" | "secondary" | "tertiary" | "accent";
  index: number;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  color,
  index,
}) => {
  return (
    <AnimatedElement
      animation="slideUp"
      delay={0.2 + index * 0.1}
      duration={0.6}
    >
      <GlassCard
        glowColor={color}
        borderGlow
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Box
            sx={{
              backgroundColor: `${color}.main`,
              borderRadius: "12px",
              p: 1.5,
              mr: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: `${color}.contrastText`,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h5" component="h3" fontWeight="bold">
            {title}
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      </GlassCard>
    </AnimatedElement>
  );
};

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const gradientAnimationControls = useAnimation();
  const isComponentMounted = useRef(true);
  const [imageError, setImageError] = React.useState(false);

  // Setup animations with proper cleanup
  useEffect(() => {
    // Set the mounted flag
    isComponentMounted.current = true;

    // Start gradient animation
    const animateGradient = async () => {
      while (isComponentMounted.current) {
        try {
          await gradientAnimationControls.start({
            scale: [1, 1.2, 1],
            opacity: [0.6, 0.9, 0.6],
            transition: {
              duration: 8,
              ease: "easeInOut",
            },
          });
          // Check mounted state again after animation completes
          if (!isComponentMounted.current) break;
        } catch (error) {
          // Handle potential promise rejection when animation is stopped
          break;
        }
      }
    };

    animateGradient();

    return () => {
      isComponentMounted.current = false;
      gradientAnimationControls.stop();
    };
  }, [gradientAnimationControls]);

  // Features data
  const features = [
    {
      icon: <Security fontSize="large" />,
      title: "Automated Security Scanner",
      description:
        "Detect common vulnerabilities like reentrancy attacks, integer overflows, and more with our advanced scanning engine.",
      color: "primary" as const,
    },
    {
      icon: <Speed fontSize="large" />,
      title: "Gas Optimization",
      description:
        "Find gas inefficiencies and optimize your smart contracts to reduce deployment and transaction costs.",
      color: "secondary" as const,
    },
    {
      icon: <Assignment fontSize="large" />,
      title: "Standards Compliance",
      description:
        "Verify compliance with ERC-20, ERC-721, and other blockchain standards to ensure compatibility.",
      color: "tertiary" as const,
    },
    {
      icon: <QueryStats fontSize="large" />,
      title: "AI Anomaly Detection",
      description:
        "Leverage machine learning to identify suspicious patterns and potential vulnerabilities in your code.",
      color: "accent" as const,
    },
    {
      icon: <BugReport fontSize="large" />,
      title: "Comprehensive Reports",
      description:
        "Get detailed reports with security findings, gas optimizations, and specific recommendations for improvement.",
      color: "primary" as const,
    },
  ];

  return (
    <Box sx={{ overflow: "hidden" }}>
      {/* Hero Section */}
      <Box
        sx={{
          position: "relative",
          minHeight: isMobile ? "70vh" : "85vh",
          display: "flex",
          alignItems: "center",
          mb: 10,
        }}
      >
        {/* Animated gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.1) 0%, transparent 50%)",
            zIndex: -1,
          }}
        >
          <motion.div
            animate={gradientAnimationControls}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 50% 50%, rgba(45, 212, 191, 0.1) 0%, transparent 50%)",
            }}
          />
        </Box>

        <Container maxWidth="xl">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <AnimatedElement animation="slideUp" delay={0.2}>
                <Typography
                  variant="h2"
                  component="h1"
                  fontWeight="bold"
                  sx={{
                    mb: 2,
                    background:
                      "linear-gradient(90deg, #f1f5f9 30%, #2dd4bf 60%, #7c3aed 90%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundSize: "200% auto",
                    animation: "gradientAnimation 4s ease-in-out infinite",
                    "@keyframes gradientAnimation": {
                      "0%": { backgroundPosition: "0% center" },
                      "100%": { backgroundPosition: "200% center" },
                    },
                  }}
                >
                  Secure Your Smart Contracts
                </Typography>
              </AnimatedElement>

              <AnimatedElement animation="slideUp" delay={0.3}>
                <Typography
                  variant="h4"
                  component="h2"
                  sx={{
                    mb: 3,
                    color: "text.secondary",
                    fontWeight: 500,
                  }}
                >
                  Automated Security Auditing Platform
                </Typography>
              </AnimatedElement>

              <AnimatedElement animation="slideUp" delay={0.4}>
                <Typography
                  variant="body1"
                  sx={{
                    mb: 4,
                    fontSize: "1.125rem",
                    color: "text.secondary",
                  }}
                >
                  Detect vulnerabilities, optimize gas usage, ensure compliance,
                  and get comprehensive reports, all in one platform. Secure
                  your blockchain applications before deployment.
                </Typography>
              </AnimatedElement>

              <AnimatedElement animation="slideUp" delay={0.5}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <GradientButton
                    variant="contained"
                    size="large"
                    gradient="primary"
                    glowEffect
                    onClick={() =>
                      navigate(isAuthenticated ? "/dashboard" : "/register")
                    }
                  >
                    {isAuthenticated ? "Go to Dashboard" : "Get Started"}
                  </GradientButton>

                  <GradientButton
                    variant="outlined"
                    size="large"
                    gradient="secondary"
                    onClick={() =>
                      navigate(isAuthenticated ? "/contracts/upload" : "/login")
                    }
                  >
                    {isAuthenticated ? "Upload Contract" : "Login"}
                  </GradientButton>
                </Box>
              </AnimatedElement>
            </Grid>

            <Grid item xs={12} md={6}>
              <AnimatedElement animation="scale" delay={0.5}>
                <Box
                  component="img"
                  src={
                    imageError ? "/fallback-image.svg" : "/security-scan.svg"
                  }
                  alt="Smart Contract Security"
                  onError={() => setImageError(true)}
                  sx={{
                    width: "100%",
                    maxWidth: 600,
                    mx: "auto",
                    display: "block",
                    filter: "drop-shadow(0 0 20px rgba(45, 212, 191, 0.3))",
                  }}
                />
              </AnimatedElement>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="xl">
          <AnimatedElement animation="slideUp" delay={0.1}>
            <Typography
              variant="h3"
              component="h2"
              fontWeight="bold"
              align="center"
              sx={{ mb: 2 }}
            >
              Platform Features
            </Typography>
          </AnimatedElement>

          <AnimatedElement animation="slideUp" delay={0.15}>
            <Typography
              variant="h6"
              component="p"
              align="center"
              color="text.secondary"
              sx={{ mb: 6, maxWidth: 800, mx: "auto" }}
            >
              Our comprehensive audit platform combines multiple tools and
              techniques to ensure your smart contracts are secure, efficient,
              and compliant.
            </Typography>
          </AnimatedElement>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={feature.title}>
                <FeatureCard
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  color={feature.color}
                  index={index}
                />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Call to Action Section */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="md">
          <AnimatedElement animation="scale">
            <GlassCard
              glowColor="secondary"
              sx={{
                textAlign: "center",
                p: { xs: 4, md: 6 },
              }}
            >
              <Typography variant="h3" component="h2" fontWeight="bold" mb={3}>
                Ready to Secure Your Smart Contracts?
              </Typography>

              <Typography
                variant="h6"
                component="p"
                color="text.secondary"
                mb={4}
              >
                Start your security journey today and protect your blockchain
                applications from vulnerabilities.
              </Typography>

              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 2 }}
                sx={{
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                  justifyContent: "center",
                }}
              >
                <GradientButton
                  variant="contained"
                  size="large"
                  gradient="primary"
                  glowEffect
                  pulseEffect
                  onClick={() =>
                    navigate(
                      isAuthenticated ? "/contracts/upload" : "/register"
                    )
                  }
                  sx={{ px: 4, py: 1.5 }}
                >
                  {isAuthenticated ? "Upload Contract" : "Create Account"}
                </GradientButton>

                <GradientButton
                  variant="outlined"
                  size="large"
                  gradient="secondary"
                  onClick={() => navigate("/vulnerabilities")}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Learn About Vulnerabilities
                </GradientButton>
              </Stack>
            </GlassCard>
          </AnimatedElement>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
