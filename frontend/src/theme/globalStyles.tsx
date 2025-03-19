import { GlobalStyles as MuiGlobalStyles } from "@mui/material";

const GlobalStyles = () => {
  return (
    <MuiGlobalStyles
      styles={(theme) => ({
        body: {
          margin: 0,
          padding: 0,
          fontFamily: theme.typography.fontFamily,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        a: {
          textDecoration: "none",
          color: theme.palette.primary.main,
          "&:hover": {
            color: theme.palette.primary.dark,
          },
        },
        "#root": {
          maxWidth: "100%",
          margin: 0,
          padding: 0,
          textAlign: "left",
        },
        // Any other global styles you want to maintain from App.css
      })}
    />
  );
};

export default GlobalStyles;
