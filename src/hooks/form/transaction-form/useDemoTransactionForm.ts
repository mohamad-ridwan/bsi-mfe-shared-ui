import { useState, useCallback } from "react";
import type {
  TransactionFormValues,
  TransactionFormErrors,
} from "../../../components/form/transaction-form/TransactionForm.types";

export type DemoTransactionType = "DEBIT" | "CREDIT";

export interface SubmittedTransactionRecord {
  id: string;
  type: DemoTransactionType;
  amount: number;
  description: string;
  timestamp: string;
}

export function useDemoTransactionForm() {
  const [transactionType, setTransactionType] =
    useState<DemoTransactionType>("DEBIT");

  const [values, setValues] = useState<TransactionFormValues>({
    amount: 150000,
    description: "Pembayaran tagihan listrik & internet",
  });

  const [errors, setErrors] = useState<TransactionFormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submittedData, setSubmittedData] =
    useState<SubmittedTransactionRecord | null>(null);

  const validate = useCallback(
    (currentValues: TransactionFormValues): boolean => {
      const newErrors: TransactionFormErrors = {};
      const numAmount = Number(currentValues.amount);

      if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
        newErrors.amount = "Nominal transaksi harus lebih besar dari Rp 0";
      }

      if (
        !currentValues.description ||
        currentValues.description.trim().length < 3
      ) {
        newErrors.description = "Keterangan transaksi minimal 3 karakter";
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [],
  );

  const handleFieldChange = useCallback(
    (field: keyof TransactionFormValues, val: any) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: val };
        // Clear error saat user mengetik
        if (errors[field]) {
          setErrors((errPrev) => ({ ...errPrev, [field]: undefined }));
        }
        return updated;
      });
    },
    [errors],
  );

  const handleAmountChange = useCallback(
    (amount: number) => {
      handleFieldChange("amount", amount);
    },
    [handleFieldChange],
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      handleFieldChange("description", description);
    },
    [handleFieldChange],
  );

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      const isValid = validate(values);
      if (!isValid) return;

      setIsLoading(true);

      // Simulasi delay asynchronous network call (1.2 detik)
      setTimeout(() => {
        const newRecord: SubmittedTransactionRecord = {
          id: `TRX-${Date.now().toString().slice(-6)}`,
          type: transactionType,
          amount: Number(values.amount),
          description: values.description.trim(),
          timestamp: new Date().toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }),
        };

        setSubmittedData(newRecord);
        setIsLoading(false);
      }, 1200);
    },
    [values, transactionType, validate],
  );

  const handleReset = useCallback(() => {
    setValues({ amount: "", description: "" });
    setErrors({});
    setSubmittedData(null);
  }, []);

  return {
    transactionType,
    setTransactionType,
    values,
    errors,
    isLoading,
    submittedData,
    handleFieldChange,
    handleAmountChange,
    handleDescriptionChange,
    handleSubmit,
    handleReset,
  };
}
