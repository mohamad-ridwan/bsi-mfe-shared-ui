import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import type { TransactionFormProps } from "./TransactionForm.types";

export default function TransactionForm({
  values,
  errors = {},
  isLoading = false,
  disabled = false,
  submitText = "Kirim Transaksi",
  loadingText = "Memproses...",
  title = "Formulir Transaksi",
  subtitle = "Bank Syariah Indonesia",
  currencyPrefix = "Rp",
  children,
  footer,
  cardSx,
  containerSx,
  hideHeader = false,
  onChange,
  onAmountChange,
  onDescriptionChange,
  onSubmit,
}: TransactionFormProps) {
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numValue = rawValue === "" ? 0 : Number(rawValue);

    if (
      Number.isFinite(numValue) &&
      numValue >= 0 &&
      numValue <= 100_000_000_000
    ) {
      if (onAmountChange) {
        onAmountChange(numValue);
      }
      if (onChange) {
        onChange("amount", numValue);
      }
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const textValue = e.target.value;

    if (onDescriptionChange) {
      onDescriptionChange(textValue);
    }
    if (onChange) {
      onChange("description", textValue);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isLoading && !disabled) {
      onSubmit(e);
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 3 },
        ...containerSx,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 480,
          ...cardSx,
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          {!hideHeader && (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  bgcolor: "primary.main",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mb: 1.5,
                  boxShadow: "0 4px 12px rgba(27, 94, 32, 0.25)",
                }}
              >
                <AccountBalanceIcon sx={{ color: "#FFFFFF", fontSize: 32 }} />
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  textAlign: "center",
                }}
              >
                {title}
              </Typography>
              {subtitle && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ textAlign: "center", mt: 0.5 }}
                >
                  {subtitle}
                </Typography>
              )}
            </Box>
          )}

          {/* Form Content */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            autoComplete="off"
            sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
          >
            {/* Slot Children: Pengganti Baris L81-L116 untuk Custom Component di Atas Input */}
            {children && <Box sx={{ width: "100%" }}>{children}</Box>}

            {/* Input Nominal (Amount) */}
            <TextField
              label="Nominal"
              type="number"
              fullWidth
              disabled={disabled || isLoading}
              value={values.amount === 0 ? "" : values.amount}
              error={Boolean(errors.amount)}
              helperText={errors.amount}
              onChange={handleAmountChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      {currencyPrefix}
                    </InputAdornment>
                  ),
                },
                htmlInput: { min: 0, max: 100000000000, step: "1" },
              }}
            />

            {/* Input Keterangan (Description) */}
            <TextField
              label="Keterangan"
              multiline
              rows={3}
              fullWidth
              disabled={disabled || isLoading}
              value={values.description}
              error={Boolean(errors.description)}
              helperText={errors.description}
              placeholder="Masukkan keterangan transaksi..."
              onChange={handleDescriptionChange}
              slotProps={{
                htmlInput: { maxLength: 255 },
              }}
            />

            {/* Tombol Submit Transaksi */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={disabled || isLoading}
              sx={{ mt: 1 }}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : undefined
              }
            >
              {isLoading ? loadingText : submitText}
            </Button>

            {/* Optional Footer Slot */}
            {footer && <Box sx={{ mt: 1 }}>{footer}</Box>}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
