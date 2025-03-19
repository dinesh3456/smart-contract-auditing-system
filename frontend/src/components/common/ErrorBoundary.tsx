import React from "react";
import { Box, Typography, Button, Paper, Collapse } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import CodeIcon from "@mui/icons-material/Code";

const reportError = (error: Error, componentStack?: string | null) => {
  // Log to console in development
  console.error("Error reported to monitoring service:", error, componentStack);

  // In production, you would send this to your error tracking service
  // Example: Sentry, LogRocket, etc.
  // if (process.env.NODE_ENV === 'production') {
  //   // Sentry.captureException(error, { extra: { componentStack } });
  // }
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  showDetails: boolean;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to the console
    console.error("Error caught by boundary:", error, errorInfo);

    // Store errorInfo for potential display
    this.setState({ errorInfo });

    // Report to error monitoring service
    reportError(error, errorInfo.componentStack);
  }

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    // If custom fallback is provided, use it when there's an error
    if (this.state.hasError && this.props.fallback) {
      return this.props.fallback;
    }

    // Default error UI
    if (this.state.hasError) {
      const { error, errorInfo, showDetails } = this.state;

      // Check if this is a chunk loading error (common with code splitting)
      const isChunkError =
        error?.message.includes("Loading chunk") ||
        error?.message.includes("Loading CSS chunk") ||
        error?.message.includes("Failed to fetch dynamically imported module");

      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            p: 3,
            textAlign: "center",
            bgcolor: "background.default",
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: 600,
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />

            <Typography variant="h5" gutterBottom color="error">
              {isChunkError
                ? "Failed to load application module"
                : "Something went wrong"}
            </Typography>

            <Typography variant="body1" paragraph>
              {isChunkError
                ? "Please check your internet connection and try refreshing the page."
                : "An unexpected error occurred. Our team has been notified."}
            </Typography>

            <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>

              {!isChunkError && (
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<CodeIcon />}
                  onClick={this.toggleDetails}
                >
                  {showDetails ? "Hide" : "Show"} Details
                </Button>
              )}
            </Box>

            {/* Collapsible error details for developers */}
            <Collapse in={showDetails} sx={{ width: "100%", mt: 3 }}>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: "background.paper",
                  textAlign: "left",
                  overflow: "auto",
                  maxHeight: 300,
                }}
              >
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Error: {error?.message}
                </Typography>

                {errorInfo && (
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {errorInfo.componentStack}
                  </Typography>
                )}
              </Paper>
            </Collapse>
          </Paper>
        </Box>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
