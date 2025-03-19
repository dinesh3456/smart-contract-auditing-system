import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Tooltip,
  Container,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Security,
  BugReport,
  Description,
  Login,
  AppRegistration,
  Person,
  Close,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GradientButton from "../common/GradientButton";

interface NavItem {
  title: string;
  path: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

const Navbar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mock authentication state (replace with actual auth context)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Navigation items
  const navItems: NavItem[] = [
    {
      title: "Dashboard",
      path: "/dashboard",
      icon: <Dashboard />,
      requiresAuth: true,
    },
    {
      title: "Contracts",
      path: "/contracts",
      icon: <Security />,
      requiresAuth: true,
    },
    {
      title: "Audit Reports",
      path: "/reports",
      icon: <Description />,
      requiresAuth: true,
    },
    {
      title: "Vulnerabilities",
      path: "/vulnerabilities",
      icon: <BugReport />,
      requiresAuth: true,
    },
  ];

  // Handle scroll event to change navbar style
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Handle logout
  const handleLogout = () => {
    // Implement logout logic here
    setIsAuthenticated(false);
    navigate("/login");
  };

  // Drawer content for mobile
  const drawer = (
    <Box
      sx={{
        width: 250,
        height: "100%",
        background: theme.palette.background.default,
        backgroundImage: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      }}
      role="presentation"
    >
      <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
        <IconButton onClick={handleDrawerToggle} color="inherit">
          <Close />
        </IconButton>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Typography variant="h6" component="div" sx={{ fontWeight: 700 }}>
            Smart Contract Auditor
          </Typography>
        </motion.div>
      </Box>

      <List>
        {navItems
          .filter(
            (item) =>
              !item.requiresAuth || (item.requiresAuth && isAuthenticated)
          )
          .map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <ListItem
                button
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                onClick={handleDrawerToggle}
                sx={{
                  my: 0.5,
                  borderRadius: 2,
                  mx: 1,
                  position: "relative",
                  overflow: "hidden",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    height: "100%",
                    width: "3px",
                    backgroundColor: "primary.main",
                    opacity: location.pathname === item.path ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  },
                  "&.Mui-selected": {
                    backgroundColor: "rgba(45, 212, 191, 0.08)",
                  },
                  "&:hover": {
                    backgroundColor: "rgba(45, 212, 191, 0.15)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color:
                      location.pathname === item.path
                        ? "primary.main"
                        : "inherit",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItem>
            </motion.div>
          ))}
      </List>

      {isAuthenticated ? (
        <Box sx={{ position: "absolute", bottom: 0, width: "100%", p: 2 }}>
          <GradientButton
            variant="contained"
            fullWidth
            onClick={handleLogout}
            startIcon={<Person />}
          >
            Logout
          </GradientButton>
        </Box>
      ) : (
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            p: 2,
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Button
            variant="outlined"
            color="primary"
            onClick={() => {
              navigate("/login");
              handleDrawerToggle();
            }}
            startIcon={<Login />}
            sx={{ width: "48%" }}
          >
            Login
          </Button>
          <GradientButton
            variant="contained"
            onClick={() => {
              navigate("/register");
              handleDrawerToggle();
            }}
            startIcon={<AppRegistration />}
            sx={{ flex: 1 }}
          >
            Register
          </GradientButton>
        </Box>
      )}
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        elevation={isScrolled ? 4 : 0}
        color="transparent"
        sx={{
          transition: "all 0.3s ease",
          background: isScrolled ? "rgba(15, 23, 42, 0.9)" : "transparent",
          backdropFilter: isScrolled ? "blur(10px)" : "none",
          borderBottom: isScrolled
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "none",
        }}
      >
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Typography
                variant="h6"
                noWrap
                component={Link}
                to="/"
                sx={{
                  mr: 2,
                  display: { xs: "none", md: "flex" },
                  fontWeight: 700,
                  background: "linear-gradient(90deg, #2dd4bf, #7c3aed)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textDecoration: "none",
                }}
              >
                Smart Contract Auditor
              </Typography>
            </motion.div>

            {/* Mobile menu button */}
            {isMobile && (
              <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
                <IconButton
                  size="large"
                  aria-label="Open menu"
                  aria-controls="menu-appbar"
                  aria-haspopup="true"
                  onClick={handleDrawerToggle}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}

            {/* Mobile logo */}
            <Typography
              variant="h6"
              noWrap
              component={Link}
              to="/"
              sx={{
                display: { xs: "flex", md: "none" },
                flexGrow: 1,
                fontWeight: 700,
                background: "linear-gradient(90deg, #2dd4bf, #7c3aed)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textDecoration: "none",
              }}
            >
              SC Auditor
            </Typography>

            {/* Desktop navigation items */}
            <Box
              sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, ml: 4 }}
            >
              {navItems
                .filter(
                  (item) =>
                    !item.requiresAuth || (item.requiresAuth && isAuthenticated)
                )
                .map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Button
                      component={Link}
                      to={item.path}
                      sx={{
                        mx: 1,
                        color:
                          location.pathname === item.path
                            ? "primary.main"
                            : "text.primary",
                        position: "relative",
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          width:
                            location.pathname === item.path ? "100%" : "0%",
                          height: "3px",
                          bottom: -2,
                          left: 0,
                          backgroundColor: "primary.main",
                          transition: "width 0.3s ease-in-out",
                          borderRadius: "2px",
                        },
                        "&:hover::after": {
                          width: "100%",
                        },
                      }}
                    >
                      {item.title}
                    </Button>
                  </motion.div>
                ))}
            </Box>

            {/* Authentication buttons */}
            <Box sx={{ display: { xs: "none", md: "flex" } }}>
              <AnimatePresence mode="wait">
                {isAuthenticated ? (
                  <motion.div
                    key="user-avatar"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Tooltip title="User Profile">
                        <IconButton
                          onClick={() => navigate("/profile")}
                          sx={{
                            border: "2px solid",
                            borderColor: "primary.main",
                            padding: "4px",
                          }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                            }}
                          >
                            <Person />
                          </Avatar>
                        </IconButton>
                      </Tooltip>
                      <Button
                        variant="outlined"
                        onClick={handleLogout}
                        sx={{ ml: 1 }}
                      >
                        Logout
                      </Button>
                    </Box>
                  </motion.div>
                ) : (
                  <motion.div
                    key="auth-buttons"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      component={Link}
                      to="/login"
                      variant="outlined"
                      startIcon={<Login />}
                      sx={{ mr: 1 }}
                    >
                      Login
                    </Button>
                    <GradientButton
                      onClick={() => navigate("/register")}
                      variant="contained"
                      startIcon={<AppRegistration />}
                    >
                      Register
                    </GradientButton>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 250,
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* Toolbar spacer */}
      <Toolbar />
    </>
  );
};

export default Navbar;
