import "./utils/mui-prefix";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import "./App.css";
import { useState } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { Container, Box, Typography } from "@mui/material";
import bsiTheme from "./theme/bsiTheme";
import { TransactionForm } from "./components/form/transaction-form";
import type { TransactionFormValues } from "./components/form/transaction-form";

export default function App() {
  const [values, setValues] = useState<TransactionFormValues>({
    amount: 100000,
    description: "Transaksi awal nasabah",
  });

  return (
    <ThemeProvider theme={bsiTheme}>
      <CssBaseline />
      <Container maxWidth="sm">
        <Box sx={{ py: 6 }}>
          <Typography variant="h5" align="center" gutterBottom color="primary" sx={{ fontWeight: 700 }}>
            BSI Micro-Frontend Shared UI
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Design System & Shared Component Catalog
          </Typography>
          <TransactionForm
            values={values}
            onChange={(field, val) => setValues((prev) => ({ ...prev, [field]: val }))}
            onSubmit={(e) => {
              if (e) e.preventDefault();
              alert(`Transaksi berhasil disubmit: Rp ${values.amount}`);
            }}
          />
        </Box>
      </Container>
    </ThemeProvider>
  );
}
