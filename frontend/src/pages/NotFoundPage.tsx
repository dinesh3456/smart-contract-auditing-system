import React from "react";
import { Box, Typography, Button } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AnimatedElement from "../components/common/AnimatedElement";
import GlassCard from "../components/common/GlassCard";
import GradientButton from "../components/common/GradientButton";

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
      }}
    >
      <AnimatedElement animation="scale">
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
            y: [0, -10, 10, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        >
          <Typography
            variant="h1"
            component="h1"
            sx={{
              fontSize: { xs: "6rem", md: "10rem" },
              fontWeight: 700,
              background: "linear-gradient(135deg, #2dd4bf 0%, #7c3aed 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              mb: 2,
            }}
          >
            404
          </Typography>
        </motion.div>
      </AnimatedElement>

      <AnimatedElement animation="fadeIn" delay={0.3}>
        <Typography
          variant="h4"
          component="h2"
          fontWeight="bold"
          sx={{ mb: 3 }}
        >
          Page Not Found
        </Typography>
      </AnimatedElement>

      <AnimatedElement animation="slideUp" delay={0.5}>
        <GlassCard sx={{ p: 4, maxWidth: 500, mx: "auto", mb: 4 }}>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track.
          </Typography>

          <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
            <GradientButton
              gradient="primary"
              variant="contained"
              size="large"
              onClick={() => navigate("/")}
            >
              Go Home
            </GradientButton>

            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </Box>
        </GlassCard>
      </AnimatedElement>
    </Box>
  );
};

export default NotFoundPage;
