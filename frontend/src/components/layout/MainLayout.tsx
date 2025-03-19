import React, { ReactNode } from "react";
import { Box, Container, CssBaseline } from "@mui/material";
import { motion } from "framer-motion";
import Navbar from "./Navbar";
import AnimatedBackground from "../common/AnimatedBackground";

// Footer component
const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: "auto",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        textAlign: "center",
      }}
    >
      <Container maxWidth="xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          Smart Contract Audit Platform &copy; {new Date().getFullYear()}
        </motion.div>
      </Container>
    </Box>
  );
};

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <CssBaseline />

      {/* Animated background */}
      <AnimatedBackground />

      {/* Navigation */}
      <Navbar />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          py: 8,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Container maxWidth="xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Footer />
    </Box>
  );
};

export default MainLayout;
