import type React from 'react';
import type { SxProps, Theme } from '@mui/material';

export interface TransactionFormValues {
  amount: number | string;
  description: string;
}

export interface TransactionFormErrors {
  amount?: string;
  description?: string;
}

export interface TransactionFormProps {
  /**
   * Nilai formulir saat ini
   */
  values: TransactionFormValues;

  /**
   * Pesan error validasi per-field
   */
  errors?: TransactionFormErrors;

  /**
   * Status loading saat proses submit sedang berjalan
   * @default false
   */
  isLoading?: boolean;

  /**
   * Status disable untuk seluruh form dan submit button
   * @default false
   */
  disabled?: boolean;

  /**
   * Teks pada tombol submit saat kondisi normal
   * @default "Kirim Transaksi"
   */
  submitText?: string;

  /**
   * Teks pada tombol submit saat kondisi loading
   * @default "Memproses..."
   */
  loadingText?: string;

  /**
   * Judul formulir pada header
   * @default "Formulir Transaksi"
   */
  title?: string;

  /**
   * Subjudul pada header
   * @default "Bank Syariah Indonesia"
   */
  subtitle?: string;

  /**
   * Custom adornment mata uang pada field nominal
   * @default "Rp"
   */
  currencyPrefix?: string;

  /**
   * Slot komponen kustom pengganti baris L81-L116.
   * Digunakan oleh consumer untuk menyisipkan badge tipe transaksi,
   * pemilihan akun, atau info nasabah di atas input nominal.
   */
  children?: React.ReactNode;

  /**
   * Slot footer opsional di bawah tombol submit (e.g. disclaimer, tombol batal)
   */
  footer?: React.ReactNode;

  /**
   * Kustomisasi styling Card MUI
   */
  cardSx?: SxProps<Theme>;

  /**
   * Kustomisasi styling outer container Box
   */
  containerSx?: SxProps<Theme>;

  /**
   * Sembunyikan header icon & title jika consumer ingin membuat custom header sendiri
   * @default false
   */
  hideHeader?: boolean;

  /**
   * Callback ketika field berubah secara umum
   */
  onChange?: <K extends keyof TransactionFormValues>(
    field: K,
    value: TransactionFormValues[K]
  ) => void;

  /**
   * Callback spesifik ketika nilai nominal berubah
   */
  onAmountChange?: (value: number) => void;

  /**
   * Callback spesifik ketika nilai keterangan berubah
   */
  onDescriptionChange?: (value: string) => void;

  /**
   * Callback saat form di-submit
   */
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
}
