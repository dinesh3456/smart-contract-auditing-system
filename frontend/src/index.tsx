import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { loadFonts } from "./theme/fonts";

// Load fonts
loadFonts();

// Create root element
const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

// Render app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Performance metrics
reportWebVitals();
