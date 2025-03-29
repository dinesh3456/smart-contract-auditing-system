import React from "react";
import {
  Typography,
  Container,
  Avatar,
  Box,
  Divider,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  Email as EmailIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import GlassCard from "../../components/common/GlassCard";
import AnimatedElement from "../../components/common/AnimatedElement";

const ProfilePage: React.FC = () => {
  const { user, loading } = useAuth();
  const theme = useTheme();

  if (loading) {
    return (
      <Container sx={{ mt: 8, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <GlassCard glowColor="primary">
          <Typography variant="h5" color="error" align="center">
            User not found. Please log in again.
          </Typography>
        </GlassCard>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <AnimatedElement animation="fadeIn">
        <GlassCard
          sx={{ p: 4, textAlign: "center" }}
          glowColor="primary"
          borderGlow
        >
          <Box
            sx={{
              mb: 4,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar
              sx={{
                width: 180,
                height: 180,
                mb: 3,
                fontSize: "4rem",
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 8px 16px rgba(0,0,0,0.2)`,
                border: `4px solid ${theme.palette.background.paper}`,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>

            <Typography
              variant="h3"
              gutterBottom
              sx={{
                background: "linear-gradient(90deg, #2dd4bf, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontWeight: "bold",
              }}
            >
              {user.name}
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Box sx={{ textAlign: "left", px: 2 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                py: 1.5,
                px: 2,
                bgcolor: "rgba(0,0,0,0.04)",
                borderRadius: 2,
              }}
            >
              <EmailIcon sx={{ mr: 2, color: "primary.main" }} />
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {user.email}
                </Typography>
              </Box>
            </Box>

            {user.company && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 1.5,
                  px: 2,
                  bgcolor: "rgba(0,0,0,0.04)",
                  borderRadius: 2,
                }}
              >
                <BusinessIcon sx={{ mr: 2, color: "primary.main" }} />
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Company
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {user.company}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </GlassCard>
      </AnimatedElement>
    </Container>
  );
};

export default ProfilePage;
