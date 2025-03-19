import { createTheme, responsiveFontSizes } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface TypeBackground {
    dark: string;
    light: string;
    gradient: string;
  }

  interface Palette {
    tertiary: Palette["primary"];
    accent: Palette["primary"];
  }

  interface PaletteOptions {
    tertiary?: PaletteOptions["primary"];
    accent?: PaletteOptions["primary"];
  }
}

// Create a base theme with futuristic colors
let theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#2dd4bf", // Teal color
      light: "#5eead4",
      dark: "#14b8a6",
      contrastText: "#0f172a",
    },
    secondary: {
      main: "#7c3aed", // Purple color
      light: "#a78bfa",
      dark: "#6d28d9",
      contrastText: "#ffffff",
    },
    tertiary: {
      main: "#ec4899", // Pink color
      light: "#f9a8d4",
      dark: "#db2777",
      contrastText: "#ffffff",
    },
    accent: {
      main: "#f59e0b", // Amber color
      light: "#fbbf24",
      dark: "#d97706",
      contrastText: "#0f172a",
    },
    background: {
      default: "#0f172a", // Dark blue
      paper: "#1e293b", // Slightly lighter blue
      dark: "#020617", // Very dark blue
      light: "#334155", // Light blue
      gradient:
        "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1e293b 100%)",
    },
    text: {
      primary: "#f1f5f9",
      secondary: "#94a3b8",
    },
    error: {
      main: "#ef4444",
    },
    warning: {
      main: "#f59e0b",
    },
    info: {
      main: "#3b82f6",
    },
    success: {
      main: "#10b981",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "3rem",
      fontWeight: 700,
      letterSpacing: "-0.01562em",
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.00833em",
      lineHeight: 1.2,
    },
    h3: {
      fontSize: "2rem",
      fontWeight: 600,
      letterSpacing: "0em",
      lineHeight: 1.3,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      letterSpacing: "0.00735em",
      lineHeight: 1.3,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      letterSpacing: "0em",
      lineHeight: 1.4,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      letterSpacing: "0.0075em",
      lineHeight: 1.4,
    },
    subtitle1: {
      fontSize: "1rem",
      fontWeight: 500,
      letterSpacing: "0.00938em",
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: "0.875rem",
      fontWeight: 500,
      letterSpacing: "0.00714em",
      lineHeight: 1.5,
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      letterSpacing: "0.00938em",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      letterSpacing: "0.01071em",
      lineHeight: 1.5,
    },
    button: {
      fontSize: "0.875rem",
      fontWeight: 600,
      letterSpacing: "0.02857em",
      textTransform: "none",
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: "none",
          padding: "10px 24px",
          boxShadow: "none",
          transition: "all 0.3s ease-in-out",
          position: "relative",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(255, 255, 255, 0.1)",
            clipPath: "circle(0% at 50% 50%)",
            transition: "clip-path 0.5s ease-in-out",
          },
          "&:hover": {
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)",
            transform: "translateY(-2px)",
            "&:before": {
              clipPath: "circle(100% at 50% 50%)",
            },
          },
          "&:active": {
            transform: "translateY(0)",
          },
        },
        contained: {
          "&.MuiButton-containedPrimary": {
            backgroundImage:
              "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)",
          },
          "&.MuiButton-containedSecondary": {
            backgroundImage:
              "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
          },
        },
        outlined: {
          borderWidth: 2,
          "&:hover": {
            borderWidth: 2,
          },
          "&.MuiButton-outlinedPrimary": {
            borderColor: "#2dd4bf",
          },
          "&.MuiButton-outlinedSecondary": {
            borderColor: "#7c3aed",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow:
            "0 10px 30px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.2)",
          position: "relative",
          overflow: "hidden",
          backgroundImage:
            "linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(30, 41, 59, 0.6) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          "&:before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(45deg, rgba(45, 212, 191, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
            zIndex: -1,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(10px)",
            "& fieldset": {
              borderWidth: 1,
              borderColor: "rgba(148, 163, 184, 0.2)",
              transition: "border-color 0.3s ease-in-out",
            },
            "&:hover fieldset": {
              borderColor: "rgba(148, 163, 184, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)",
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(90deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
          backdropFilter: "blur(10px)",
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          overflowX: "auto",
          background: "rgba(30, 41, 59, 0.5)",
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(15, 23, 42, 0.6)",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(odd)": {
            backgroundColor: "rgba(30, 41, 59, 0.3)",
          },
          "&:hover": {
            backgroundColor: "rgba(30, 41, 59, 0.5) !important",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
        filled: {
          "&.MuiChip-colorPrimary": {
            backgroundImage:
              "linear-gradient(135deg, #2dd4bf 0%, #0d9488 100%)",
          },
          "&.MuiChip-colorSecondary": {
            backgroundImage:
              "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)",
          },
          "&.MuiChip-colorSuccess": {
            backgroundImage:
              "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          },
          "&.MuiChip-colorError": {
            backgroundImage:
              "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          },
          "&.MuiChip-colorWarning": {
            backgroundImage:
              "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
          },
          "&.MuiChip-colorInfo": {
            backgroundImage:
              "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          },
        },
      },
    },
  },
});

// Make fonts responsive
theme = responsiveFontSizes(theme);

export default theme;
