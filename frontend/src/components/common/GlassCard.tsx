import React, { ReactNode } from "react";
import { Card, CardProps, Box, styled } from "@mui/material";
import { motion } from "framer-motion";

// Define the glow color type to ensure type safety
type GlowColorType = "primary" | "secondary" | "tertiary" | "accent" | "none";

interface GlassCardProps extends Omit<CardProps, "css"> {
  hoverEffect?: boolean;
  glowColor?: GlowColorType;
  borderGlow?: boolean;
  children: ReactNode;
}

// Create a styled card with glass morphism effect
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) =>
    prop !== "hoverEffect" && prop !== "glowColor" && prop !== "borderGlow",
})<{
  hoverEffect?: boolean;
  glowColor?: GlowColorType;
  borderGlow?: boolean;
}>(({ theme, hoverEffect, glowColor = "none", borderGlow }) => {
  // Define glow colors
  const glowColors: Record<GlowColorType, string> = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    tertiary: "#ec4899",
    accent: "#f59e0b",
    none: "transparent",
  };

  // Define RGB values for shadows
  const rgbValues: Record<GlowColorType, string> = {
    primary: "45, 212, 191",
    secondary: "124, 58, 237",
    tertiary: "236, 72, 153",
    accent: "245, 158, 11",
    none: "0, 0, 0",
  };

  // Get the appropriate RGB value based on glow color
  const shadowRgb = rgbValues[glowColor];

  return {
    background: "rgba(30, 41, 59, 0.6)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: theme.spacing(3),
    position: "relative",
    overflow: "hidden",
    border: borderGlow
      ? `1px solid ${
          glowColor !== "none"
            ? glowColors[glowColor]
            : "rgba(255, 255, 255, 0.1)"
        }`
      : "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow:
      glowColor !== "none"
        ? `0 0 20px rgba(${shadowRgb}, 0.15)`
        : "0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.2)",
    transition: "all 0.3s ease",
    transform: hoverEffect ? "translateY(0)" : "none",

    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: "4px",
      background:
        glowColor !== "none"
          ? `linear-gradient(90deg, transparent, ${glowColors[glowColor]}, transparent)`
          : "transparent",
      opacity: 0.7,
    },

    "&:hover": hoverEffect
      ? {
          transform: "translateY(-5px)",
          boxShadow:
            glowColor !== "none"
              ? `0 15px 30px rgba(${shadowRgb}, 0.2)`
              : "0 15px 35px rgba(0, 0, 0, 0.2), 0 3px 10px rgba(0, 0, 0, 0.1)",
        }
      : {},
  };
});

const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hoverEffect = true,
  glowColor = "none",
  borderGlow = false,
  ...props
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <StyledCard
        hoverEffect={hoverEffect}
        glowColor={glowColor}
        borderGlow={borderGlow}
        {...props}
      >
        <Box sx={{ position: "relative", zIndex: 1 }}>{children}</Box>
      </StyledCard>
    </motion.div>
  );
};

export default GlassCard;
