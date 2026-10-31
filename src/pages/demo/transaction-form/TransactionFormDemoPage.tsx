import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Divider,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Stack,
} from "@mui/material";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useDemoTransactionForm } from "../../../hooks/form/transaction-form";
import { TransactionForm } from "../../../components/form/transaction-form";

export default function TransactionFormDemoPage() {
  const {
    transactionType,
    setTransactionType,
    values,
    errors,
    isLoading,
    submittedData,
    handleAmountChange,
    handleDescriptionChange,
    handleSubmit,
    handleReset,
  } = useDemoTransactionForm();

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(val);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #388E3C 100%)",
        p: { xs: 2, md: 4 },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
      }}
    >
      {/* Demo Page Banner */}
      <Paper
        elevation={0}
        sx={{
          py: 1,
          px: 3,
          borderRadius: 4,
          bgcolor: "rgba(255, 255, 255, 0.15)",
          backdropFilter: "blur(10px)",
          color: "#FFFFFF",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
        }}
      >
        <InfoOutlinedIcon fontSize="small" />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Interactive Demo: <code>/demo/form/transaction-form</code> (Testing
          Reusable Component)
        </Typography>
      </Paper>

      {/* Main Grid: Form di Kiri/Atas & Result Card di Kanan/Bawah */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{
          width: "100%",
          maxWidth: 1024,
          alignItems: "stretch",
          justifyContent: "center",
        }}
      >
        {/* Kolom 1: Reusable Transaction Form */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <TransactionForm
            values={values}
            errors={errors}
            isLoading={isLoading}
            onAmountChange={handleAmountChange}
            onDescriptionChange={handleDescriptionChange}
            onSubmit={handleSubmit}
            containerSx={{ p: 0 }}
          >
            {/* INJECTED CHILDREN (Slot Pengganti L81-L116) */}
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: "background.default",
                border: "1px dashed",
                borderColor: "divider",
                mb: 0.5,
              }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 1, fontWeight: 700 }}
              >
                KOMPONEN CONSUMER: PILIH JENIS TRANSAKSI
              </Typography>

              <RadioGroup
                row
                value={transactionType}
                onChange={(e) =>
                  setTransactionType(e.target.value as "DEBIT" | "CREDIT")
                }
              >
                <FormControlLabel
                  value="DEBIT"
                  control={<Radio size="small" color="error" />}
                  label={
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <TrendingDownIcon fontSize="small" color="error" />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "error.main" }}
                      >
                        DEBIT
                      </Typography>
                    </Box>
                  }
                />
                <FormControlLabel
                  value="CREDIT"
                  control={<Radio size="small" color="success" />}
                  label={
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <TrendingUpIcon fontSize="small" color="success" />
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "success.main" }}
                      >
                        CREDIT
                      </Typography>
                    </Box>
                  }
                />
              </RadioGroup>
            </Box>
          </TransactionForm>
        </Box>

        {/* Kolom 2: Material UI Card Hasil Input Value */}
        <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <Card
            sx={{
              width: "100%",
              maxWidth: 480,
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
            }}
          >
            <CardContent
              sx={{ p: 4, flex: 1, display: "flex", flexDirection: "column" }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}
              >
                <CheckCircleOutlinedIcon
                  color="primary"
                  sx={{ fontSize: 28 }}
                />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Live Form Output
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Data berikut menunjukkan nilai real-time dari props dan hasil
                submit yang ditangkap oleh consumer.
              </Typography>

              <Divider sx={{ mb: 2.5 }} />

              {/* Status Submit Card */}
              {submittedData ? (
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: "rgba(46, 125, 50, 0.1)",
                    border: "1px solid",
                    borderColor: "success.light",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "success.dark", fontWeight: 700 }}
                  >
                    Transaksi Berhasil Disimulasikan!
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary" }}
                  >
                    ID: {submittedData.id} • Pukul: {submittedData.timestamp}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 2,
                    mb: 2,
                    borderRadius: 2,
                    bgcolor: "grey.100",
                    border: "1px dashed",
                    borderColor: "grey.400",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Belum ada transaksi yang disubmit. Silakan isi form dan klik{" "}
                    <strong>Kirim Transaksi</strong>.
                  </Typography>
                </Box>
              )}

              {/* Data Preview Table/List */}
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Tipe Transaksi (Slot):
                  </Typography>
                  <Chip
                    size="small"
                    icon={
                      transactionType === "DEBIT" ? (
                        <TrendingDownIcon fontSize="small" />
                      ) : (
                        <TrendingUpIcon fontSize="small" />
                      )
                    }
                    label={transactionType}
                    color={transactionType === "DEBIT" ? "error" : "success"}
                    variant="outlined"
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Nominal Terisi:
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 700, color: "primary.main" }}
                  >
                    {values.amount
                      ? formatRupiah(Number(values.amount))
                      : "Rp 0"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Keterangan Terisi:
                  </Typography>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1.5,
                      bgcolor: "background.default",
                      minHeight: 64,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontStyle: values.description ? "normal" : "italic",
                      }}
                    >
                      {values.description || "Belum ada keterangan..."}
                    </Typography>
                  </Paper>
                </Box>
              </Stack>

              <Box sx={{ mt: "auto", pt: 2 }}>
                <Button
                  variant="outlined"
                  color="inherit"
                  fullWidth
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset Form & Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </Box>
  );
}
