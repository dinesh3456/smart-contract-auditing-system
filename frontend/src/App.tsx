import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Outlet,
} from "react-router-dom";
import { ThemeProvider, CssBaseline, Box } from "@mui/material";
import { AnimatePresence } from "framer-motion";
import theme from "./theme/theme";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CircularProgress, Typography } from "@mui/material";
import GlobalStyles from "./theme/globalStyles";

// Layout
import MainLayout from "./components/layout/MainLayout";
import ErrorBoundary from "./components/common/ErrorBoundary";

// Loading component
const PageLoader = () => (
  <Box
    sx={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      gap: 2,
    }}
  >
    <CircularProgress color="primary" />
    <Typography variant="body1" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

// Pages (import placeholder components for now)
const HomePage = React.lazy(() => import("./pages/HomePage"));
const LoginPage = React.lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = React.lazy(() => import("./pages/auth/RegisterPage"));
const DashboardPage = React.lazy(
  () => import("./pages/dashboard/DashboardPage")
);
const ContractsPage = React.lazy(
  () => import("./pages/contracts/ContractsPage")
);
const ContractDetailPage = React.lazy(
  () => import("./pages/contracts/ContractDetailPage")
);
const UploadContractPage = React.lazy(
  () => import("./pages/contracts/UploadContractPage")
);
const ReportsPage = React.lazy(() => import("./pages/reports/ReportsPage"));
const VulnerabilitiesPage = React.lazy(
  () => import("./pages/vulnerabilities/VulnerabilitiesPage")
);
const NotFoundPage = React.lazy(() => import("./pages/NotFoundPage"));

// Protected Route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectPath = "/login",
}) => {
  const { isAuthenticated, loading } = useAuth();

  // If still loading auth state, return loading indicator
  if (loading) {
    return <PageLoader />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // If authenticated, render children
  return <>{children}</>;
};

// AnimatedRoutes component to handle exit animations
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contracts"
          element={
            <ProtectedRoute>
              <Outlet /> {/* Add import for Outlet from react-router-dom */}
            </ProtectedRoute>
          }
        >
          <Route index element={<ContractsPage />} />
          <Route path="upload" element={<UploadContractPage />} />
          <Route path=":id" element={<ContractDetailPage />} />
        </Route>

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ReportsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vulnerabilities"
          element={
            <ProtectedRoute>
              <VulnerabilitiesPage />
            </ProtectedRoute>
          }
        />

        {/* 404 route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AnimatePresence>
  );
};

// App with Error Boundary
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles />
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <React.Suspense fallback={<PageLoader />}>
              <MainLayout>
                <AnimatedRoutes />
              </MainLayout>
            </React.Suspense>
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
