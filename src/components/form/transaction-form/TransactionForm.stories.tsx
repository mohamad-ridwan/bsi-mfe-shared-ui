import type { Meta, StoryObj } from "@storybook/react";
import React, { useState } from "react";
import { Box, Alert, FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import TransactionForm from "./TransactionForm";
import type { TransactionFormProps, TransactionFormValues } from "./TransactionForm.types";

const meta: Meta<typeof TransactionForm> = {
  title: "Components/Form/TransactionForm",
  component: TransactionForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Komponen reusable formulir transaksi finansial mikro-frontend (MFE) Bank BSI / BRI. Memenuhi Acceptance Criteria AC-01 s/d AC-05 dengan validasi nominal, proteksi idempotency double submit, sanitasi deskripsi, slotting inversion of control, dan presentasi error dinamis.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    onSubmit: { action: "submitted" },
    onAmountChange: { action: "amountChanged" },
    onDescriptionChange: { action: "descriptionChanged" },
    onChange: { action: "formChanged" },
  },
};

export default meta;
type Story = StoryObj<typeof TransactionForm>;

// Wrapper interaktif untuk mengelola state form di story
const InteractiveTransactionForm = (args: Partial<TransactionFormProps>) => {
  const [values, setValues] = useState<TransactionFormValues>({
    amount: args.values?.amount ?? 0,
    description: args.values?.description ?? "",
  });

  return (
    <TransactionForm
      values={values}
      title={args.title}
      subtitle={args.subtitle}
      submitText={args.submitText}
      loadingText={args.loadingText}
      isLoading={args.isLoading}
      disabled={args.disabled}
      hideHeader={args.hideHeader}
      errors={args.errors}
      footer={args.footer}
      onChange={<K extends keyof TransactionFormValues>(field: K, val: TransactionFormValues[K]) => {
        setValues((prev) => ({ ...prev, [field]: val }));
        args.onChange?.(field, val);
      }}
      onAmountChange={(val: number) => {
        setValues((prev) => ({ ...prev, amount: val }));
        args.onAmountChange?.(val);
      }}
      onDescriptionChange={(val: string) => {
        setValues((prev) => ({ ...prev, description: val }));
        args.onDescriptionChange?.(val);
      }}
      onSubmit={(e?: React.SyntheticEvent<HTMLFormElement>) => {
        if (e) e.preventDefault();
        args.onSubmit?.(e);
      }}
    >
      {args.children}
    </TransactionForm>
  );
};

/**
 * 1. Default (Standard Happy Path)
 * Tampilan form transaksi standar tanpa nilai awal.
 */
export const Default: Story = {
  render: (args: TransactionFormProps) => <InteractiveTransactionForm {...args} />,
  args: {
    title: "Transfer Antar Rekening BSI",
    subtitle: "Masukkan detail nominal dan keterangan transaksi",
    submitText: "Kirim Dana",
    values: {
      amount: 0,
      description: "",
    },
    onSubmit: (e) => {
      if (e) e.preventDefault();
    },
  },
};

/**
 * 2. WithCustomSlots (AC-04 Slotting Inversion of Control)
 * Menginjeksi slot `children` di atas nominal (Account Selector)
 * dan slot `footer` di bawah tombol submit (Security Notice).
 */
export const WithCustomSlots: Story = {
  render: (args: TransactionFormProps) => (
    <InteractiveTransactionForm
      {...args}
      footer={
        <Alert severity="info" icon={<LockOutlinedIcon fontSize="small" />} sx={{ fontSize: "0.8rem", borderRadius: 2 }}>
          Transaksi dilindungi enkripsi SSL 256-bit berstandar Bank BRI / BSI Security Operations.
        </Alert>
      }
    >
      <Box sx={{ mb: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="account-source-label">Rekening Sumber</InputLabel>
          <Select
            labelId="account-source-label"
            defaultValue="bsi-easy-mudharabah"
            label="Rekening Sumber"
            startAdornment={<AccountBalanceWalletOutlinedIcon sx={{ mr: 1, color: "primary.main" }} />}
          >
            <MenuItem value="bsi-easy-mudharabah">BSI Easy Mudharabah - 7129038192 (Rp 25.400.000)</MenuItem>
            <MenuItem value="bsi-giro-wadiah">BSI Giro Wadiah - 1092837482 (Rp 150.000.000)</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </InteractiveTransactionForm>
  ),
  args: {
    title: "Transfer Valuta & Kliring",
    subtitle: "Silakan pilih rekening debet dan lengkapi rincian transfer",
    submitText: "Konfirmasi & Proses",
    values: {
      amount: 0,
      description: "",
    },
    onSubmit: (e) => {
      if (e) e.preventDefault();
    },
  },
};

/**
 * 3. LoadingState (AC-02 Idempotency Protection)
 * Menyimulasikan kondisi sedang memproses transaksi.
 * Tombol submit menampilkan spinner CircularProgress dan semua input dinonaktifkan (disabled).
 */
export const LoadingState: Story = {
  render: (args: TransactionFormProps) => <InteractiveTransactionForm {...args} />,
  args: {
    title: "Transfer Dana Otomatis",
    subtitle: "Transaksi sedang divalidasi ke core banking",
    isLoading: true,
    loadingText: "Memproses ke Core Banking BSI...",
    values: {
      amount: 1500000,
      description: "Pembayaran tagihan vendor IT",
    },
    onSubmit: (e) => {
      if (e) e.preventDefault();
    },
  },
};

/**
 * 4. ValidationError (AC-05 Dynamic Error Presentation)
 * Menampilkan pesan validasi error dari consumer MFE.
 * Input ditandai dengan aria-invalid="true" dan helper text merah menyala.
 */
export const ValidationError: Story = {
  render: (args: TransactionFormProps) => <InteractiveTransactionForm {...args} />,
  args: {
    title: "Kirim Dana BSI Hasanah",
    subtitle: "Periksa kembali data masukan sebelum mengirim",
    values: {
      amount: 5000,
      description: "Transfer".repeat(40),
    },
    errors: {
      amount: "Nominal minimal transaksi transfer adalah Rp 10.000",
      description: "Keterangan transaksi maksimal 255 karakter",
    },
    onSubmit: (e) => {
      if (e) e.preventDefault();
    },
  },
};

/**
 * 5. WithPrefilledValues
 * Menampilkan kondisi form dengan data nominal dan keterangan yang sudah terisi sebelumnya.
 */
export const WithPrefilledValues: Story = {
  render: (args: TransactionFormProps) => <InteractiveTransactionForm {...args} />,
  args: {
    title: "Rincian Transaksi Terjadwal",
    subtitle: "Data transaksi telah disiapkan secara otomatis",
    values: {
      amount: 75000000,
      description: "Pembayaran Invoice Termin 1 Pengadaan Perangkat Keras Jaringan BSI",
    },
    submitText: "Lanjutkan Pembayaran",
    onSubmit: (e) => {
      if (e) e.preventDefault();
    },
  },
};

/**
 * 6. WithoutHeader
 * Menampilkan varian form tanpa header card (minimalist mode untuk embedding di modal/dialog).
 */
export const WithoutHeader: Story = {
  render: (args: TransactionFormProps) => <InteractiveTransactionForm {...args} />,
  args: {
    hideHeader: true,
    submitText: "Bayar Sekarang",
    values: {
      amount: 500000,
      description: "Top-up e-wallet nasabah",
    },
    onSubmit: (e) => {
      if (e) e.preventDefault();
    },
  },
};
