import type { Preview } from "@storybook/react";
import React from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import bsiTheme from "../src/theme/bsiTheme";
import "../src/utils/mui-prefix";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import "../src/App.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#F8F9FA" },
        { name: "white", value: "#FFFFFF" },
        { name: "dark", value: "#1E1E1E" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider theme={bsiTheme}>
        <CssBaseline />
        <div style={{ padding: "2rem", maxWidth: "600px", margin: "0 auto" }}>
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
};

export default preview;

