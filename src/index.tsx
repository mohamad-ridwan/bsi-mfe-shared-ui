import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import {
  StyledEngineProvider,
  ThemeProvider,
  createTheme,
} from "@mui/material/styles";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root tidak ditemukan di index.html");
}

const theme = createTheme({
  modularCssLayers: "@layer theme, base, mui, components, utilities;",
});

createRoot(rootElement).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
);
