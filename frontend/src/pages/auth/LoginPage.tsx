import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Container,
  Alert,
  InputAdornment,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  LockOutlined,
  EmailOutlined,
} from "@mui/icons-material";

import GlassCard from "../../components/common/GlassCard";
import GradientButton from "../../components/common/GradientButton";
import AnimatedElement from "../../components/common/AnimatedElement";
import { useAuth } from "../../context/AuthContext";

const LoginPage: React.FC = () => {
  const { login, isAuthenticated, error, clearError, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
  });

  // Handle form validation
  const validateForm = (): boolean => {
    let valid = true;
    const errors = {
      email: "",
      password: "",
    };

    const validateEmail = (email: string): boolean => {
      const regex =
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return regex.test(String(email).toLowerCase());
    };

    // In the validateForm function:
    if (!email) {
      errors.email = "Email is required";
      valid = false;
    } else if (!validateEmail(email)) {
      errors.email = "Email is invalid";
      valid = false;
    }

    // Validate password
    if (!password) {
      errors.password = "Password is required";
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Clear any previous errors
    clearError();

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Submit login
    await login(email, password);
  };

  // Redirect if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: { xs: 4, md: 8 },
          mb: { xs: 4, md: 8 },
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <AnimatedElement animation="slideUp" delay={0.1}>
          <motion.div
            initial={{ rotate: -5, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Typography
              component="h1"
              variant="h3"
              fontWeight="bold"
              align="center"
              mb={3}
              sx={{
                background: "linear-gradient(90deg, #2dd4bf, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Welcome Back
            </Typography>
          </motion.div>
        </AnimatedElement>

        <AnimatedElement animation="fadeIn" delay={0.2}>
          <GlassCard
            sx={{
              width: "100%",
              p: 4,
            }}
            glowColor="primary"
            borderGlow
          >
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailOutlined />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!formErrors.password}
                helperText={formErrors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                      borderWidth: 2,
                    },
                  },
                }}
              />

              <Box sx={{ mt: 3 }}>
                <GradientButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  gradient="primary"
                  glowEffect
                  disabled={loading}
                  startIcon={<LoginIcon />}
                  sx={{ mt: 2, mb: 2 }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </GradientButton>
              </Box>

              <Box sx={{ mt: 2, textAlign: "center" }}>
                <MuiLink
                  component={Link}
                  to="/register"
                  variant="body2"
                  color="primary.main"
                >
                  Don't have an account? Sign Up
                </MuiLink>
              </Box>
            </Box>
          </GlassCard>
        </AnimatedElement>
      </Box>
    </Container>
  );
};

export default LoginPage;
