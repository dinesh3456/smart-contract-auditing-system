import React from "react";
import { Button, ButtonProps, styled } from "@mui/material";
import { motion } from "framer-motion";

interface GradientButtonProps extends ButtonProps {
  gradient?: "primary" | "secondary" | "tertiary" | "accent";
  glowEffect?: boolean;
  pulseEffect?: boolean;
}

// Create a styled button with gradient background and effects
const StyledButton = styled(Button, {
  shouldForwardProp: (prop) =>
    prop !== "gradient" && prop !== "glowEffect" && prop !== "pulseEffect",
})<GradientButtonProps>(
  ({ gradient = "primary", glowEffect = false, pulseEffect = false }) => {
    // Define gradients for different color schemes
    const gradients = {
      primary: "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)",
      secondary: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
      tertiary: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
      accent: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    };

    // Define glow colors based on gradient
    const glowColors = {
      primary: "rgba(45, 212, 191, 0.5)",
      secondary: "rgba(124, 58, 237, 0.5)",
      tertiary: "rgba(236, 72, 153, 0.5)",
      accent: "rgba(245, 158, 11, 0.5)",
    };

    return {
      backgroundImage: gradients[gradient],
      boxShadow: glowEffect ? `0 0 20px ${glowColors[gradient]}` : "none",
      transition: "all 0.3s ease",
      position: "relative",
      overflow: "hidden",
      fontWeight: 600,

      "&::before": pulseEffect
        ? {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "inherit",
            animation: pulseEffect ? "pulse 2s infinite" : "none",
          }
        : {},

      "@keyframes pulse": {
        "0%": {
          opacity: 0.5,
          transform: "scale(1)",
        },
        "50%": {
          opacity: 0,
          transform: "scale(1.5)",
        },
        "100%": {
          opacity: 0,
          transform: "scale(1.5)",
        },
      },

      "&:hover": {
        boxShadow: glowEffect
          ? `0 0 30px ${glowColors[gradient]}`
          : "0 10px 20px rgba(0, 0, 0, 0.2)",
        transform: "translateY(-2px)",
      },

      "&:active": {
        transform: "translateY(0)",
      },
    };
  }
);

const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  gradient = "primary",
  glowEffect = false,
  pulseEffect = false,
  ...props
}) => {
  return (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <StyledButton
        gradient={gradient}
        glowEffect={glowEffect}
        pulseEffect={pulseEffect}
        {...props}
      >
        {children}
      </StyledButton>
    </motion.div>
  );
};

export default GradientButton;
