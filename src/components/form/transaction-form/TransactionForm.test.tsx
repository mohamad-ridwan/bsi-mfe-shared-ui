import { screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../../../test/test-utils';
import TransactionForm from './TransactionForm';

describe('TransactionForm Component - Acceptance Criteria (AC) Traceability BSI-9', () => {
  const defaultValues = {
    amount: 150000,
    description: 'Pembayaran tagihan listrik',
  };

  const defaultProps = {
    values: defaultValues,
    onSubmit: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // CORE RENDERING & CONFIGURATION
  // =========================================================================
  describe('Core Component Rendering', () => {
    // TC-01: Render default dengan konfigurasi minimum
    it('TC-01: should render correctly with default props', () => {
      render(<TransactionForm {...defaultProps} />);

      // Header default
      expect(screen.getByText('Formulir Transaksi')).toBeInTheDocument();
      expect(screen.getByText('Bank Syariah Indonesia')).toBeInTheDocument();

      // Currency prefix default
      expect(screen.getByText('Rp')).toBeInTheDocument();

      // Inputs with default values
      const amountInput = screen.getByLabelText(/Nominal/i) as HTMLInputElement;
      const descriptionInput = screen.getByLabelText(/Keterangan/i) as HTMLTextAreaElement;

      expect(amountInput.value).toBe('150000');
      expect(descriptionInput.value).toBe('Pembayaran tagihan listrik');

      // Submit button default text
      expect(
        screen.getByRole('button', { name: 'Kirim Transaksi' }),
      ).toBeInTheDocument();
    });

    // TC-03: Sembunyikan header
    it('TC-03: should not render header when hideHeader is true', () => {
      render(<TransactionForm {...defaultProps} hideHeader={true} />);

      expect(screen.queryByText('Formulir Transaksi')).not.toBeInTheDocument();
      expect(screen.queryByText('Bank Syariah Indonesia')).not.toBeInTheDocument();
      expect(screen.queryByTestId('AccountBalanceIcon')).not.toBeInTheDocument();
    });

    // TC-04: Kustomisasi teks header & subjudul kosong
    it('TC-04: should render custom title and omit subtitle when subtitle is empty', () => {
      render(
        <TransactionForm
          {...defaultProps}
          title="Kustom Title"
          subtitle=""
        />,
      );

      expect(screen.getByText('Kustom Title')).toBeInTheDocument();
      expect(screen.queryByText('Bank Syariah Indonesia')).not.toBeInTheDocument();
    });

    // TC-11: Submit formulir pada kondisi normal
    it('TC-11: should call onSubmit when submitting the form under normal conditions', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();

      render(<TransactionForm {...defaultProps} onSubmit={handleSubmit} />);

      const submitBtn = screen.getByRole('button', { name: 'Kirim Transaksi' });
      await user.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // [AC-01] Validasi Nominal
  // Detail:
  // - Field Nominal hanya menerima angka positif dengan nilai minimum Rp 10.000 dan maksimum Rp 100.000.000.000 (100 Miliar)
  // - Bila nilai nominal bernilai 0 atau dikosongkan, input harus menampilkan string kosong, bukan angka 0 telanjang
  // =========================================================================
  describe('[AC-01] Validasi Nominal', () => {
    // TC-02: Render nominal dengan nilai 0 (zero)
    it('TC-02 [AC-01]: should render empty string for amount when value is 0', () => {
      render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: 0, description: '' }}
        />,
      );

      const amountInput = screen.getByLabelText(/Nominal/i) as HTMLInputElement;
      expect(amountInput.value).toBe('');
    });

    // TC-07: Pengubahan nilai nominal transaksi yang valid
    it('TC-07 [AC-01]: should trigger onAmountChange and onChange when typing valid amount input', async () => {
      const user = userEvent.setup();
      const handleAmountChange = jest.fn();
      const handleChange = jest.fn();

      render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: '', description: '' }}
          onAmountChange={handleAmountChange}
          onChange={handleChange}
        />,
      );

      const amountInput = screen.getByLabelText(/Nominal/i);
      await user.type(amountInput, '500000');

      expect(handleAmountChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledWith('amount', expect.any(Number));
    });

    it('TC-07b [AC-01]: should handle amount change when optional callbacks are not provided', async () => {
      const user = userEvent.setup();

      render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: '', description: '' }}
        />,
      );

      const amountInput = screen.getByLabelText(/Nominal/i);
      await user.type(amountInput, '123');
      expect(amountInput).toBeInTheDocument();
    });

    // TC-07c: Validasi batas nominal (maksimum 100 Miliar dan non-negatif)
    it('TC-07c [AC-01]: should not trigger callbacks when amount exceeds limit (>100B) or is negative', () => {
      const handleAmountChange = jest.fn();
      const handleChange = jest.fn();

      render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: '', description: '' }}
          onAmountChange={handleAmountChange}
          onChange={handleChange}
        />,
      );

      const amountInput = screen.getByLabelText(/Nominal/i);

      // 1. Nominal melebihi batas 100 Miliar
      fireEvent.change(amountInput, { target: { value: '100000000001' } });
      expect(handleAmountChange).not.toHaveBeenCalled();
      expect(handleChange).not.toHaveBeenCalled();

      // 2. Nominal negatif
      fireEvent.change(amountInput, { target: { value: '-5000' } });
      expect(handleAmountChange).not.toHaveBeenCalled();
      expect(handleChange).not.toHaveBeenCalled();
    });

    // TC-08: Pengosongan nilai nominal transaksi
    it('TC-08 [AC-01]: should trigger onAmountChange with 0 and onChange with 0 when amount input is cleared', async () => {
      const user = userEvent.setup();
      const handleAmountChange = jest.fn();
      const handleChange = jest.fn();

      render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: 1000, description: '' }}
          onAmountChange={handleAmountChange}
          onChange={handleChange}
        />,
      );

      const amountInput = screen.getByLabelText(/Nominal/i);
      await user.clear(amountInput);

      expect(handleAmountChange).toHaveBeenCalledWith(0);
      expect(handleChange).toHaveBeenCalledWith('amount', 0);
    });
  });

  // =========================================================================
  // [AC-02] Proteksi Idempotency & Double Submission
  // Detail:
  // - Saat proses transaksi berlangsung (isLoading = true), tombol submit menampilkan spinner & loadingText, form disabled
  // - Trigger submit saat isLoading atau disabled tidak boleh mengeksekusi onSubmit
  // =========================================================================
  describe('[AC-02] Proteksi Idempotency & Double Submission', () => {
    // TC-12: Proteksi submit saat kondisi isLoading
    it('TC-12 [AC-02]: should disable submit button, show loadingText and CircularProgress, and prevent onSubmit when isLoading is true', () => {
      const handleSubmit = jest.fn();

      render(
        <TransactionForm
          {...defaultProps}
          isLoading={true}
          loadingText="Memproses..."
          onSubmit={handleSubmit}
        />,
      );

      const submitBtn = screen.getByRole('button', { name: /Memproses\.\.\./i });
      expect(submitBtn).toBeDisabled();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();

      const amountInput = screen.getByLabelText(/Nominal/i);
      const descriptionInput = screen.getByLabelText(/Keterangan/i);
      expect(amountInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();

      // Trigger submit event pada form untuk menguji branch logic guard handleSubmit
      const form = submitBtn.closest('form');
      expect(form).not.toBeNull();
      if (form) {
        fireEvent.submit(form);
      }
      expect(handleSubmit).not.toHaveBeenCalled();
    });

    // TC-13: Proteksi submit saat kondisi disabled
    it('TC-13 [AC-02]: should disable all inputs and submit button, and prevent onSubmit when disabled is true', () => {
      const handleSubmit = jest.fn();

      render(
        <TransactionForm
          {...defaultProps}
          disabled={true}
          onSubmit={handleSubmit}
        />,
      );

      const amountInput = screen.getByLabelText(/Nominal/i);
      const descriptionInput = screen.getByLabelText(/Keterangan/i);
      const submitBtn = screen.getByRole('button', { name: 'Kirim Transaksi' });

      expect(amountInput).toBeDisabled();
      expect(descriptionInput).toBeDisabled();
      expect(submitBtn).toBeDisabled();

      // Trigger submit event pada form untuk menguji branch logic guard handleSubmit
      const form = submitBtn.closest('form');
      expect(form).not.toBeNull();
      if (form) {
        fireEvent.submit(form);
      }
      expect(handleSubmit).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // [AC-03] Keterangan Transaksi & Sanitasi
  // Detail:
  // - Input Keterangan menerima teks multiline dengan panjang maksimal 255 karakter
  // =========================================================================
  describe('[AC-03] Keterangan Transaksi & Sanitasi', () => {
    // TC-09: Pengubahan teks keterangan transaksi
    it('TC-09 [AC-03]: should trigger onDescriptionChange and onChange when typing in description input', async () => {
      const user = userEvent.setup();
      const handleDescriptionChange = jest.fn();
      const handleChange = jest.fn();

      render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: 0, description: '' }}
          onDescriptionChange={handleDescriptionChange}
          onChange={handleChange}
        />,
      );

      const descriptionInput = screen.getByLabelText(/Keterangan/i);
      await user.type(descriptionInput, 'Transfer tagihan');

      expect(handleDescriptionChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledWith('description', expect.any(String));
    });

    it('TC-09b [AC-03]: should handle description change when optional callbacks are not provided', async () => {
      const user = userEvent.setup();

      render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: 0, description: '' }}
        />,
      );

      const descriptionInput = screen.getByLabelText(/Keterangan/i);
      await user.type(descriptionInput, 'Catatan tambahan');
      expect(descriptionInput).toBeInTheDocument();
    });
  });

  // =========================================================================
  // [AC-04] Slotting Inversion of Control
  // Detail:
  // - Formulir menyediakan slot children di atas field nominal
  // - Formulir menyediakan slot footer di bawah tombol submit
  // =========================================================================
  describe('[AC-04] Slotting Inversion of Control', () => {
    // TC-05: Injeksi komponen kustom pada slot children
    it('TC-05 [AC-04]: should render custom injected children slot above nominal input', () => {
      render(
        <TransactionForm {...defaultProps}>
          <div data-testid="custom-account-selector">Pilih Rekening Sumber</div>
        </TransactionForm>,
      );

      expect(screen.getByTestId('custom-account-selector')).toBeInTheDocument();
      expect(screen.getByText('Pilih Rekening Sumber')).toBeInTheDocument();
    });

    // TC-06: Injeksi komponen pada slot footer
    it('TC-06 [AC-04]: should render custom footer slot below submit button', () => {
      render(
        <TransactionForm
          {...defaultProps}
          footer={<div data-testid="custom-footer">Catatan Keamanan Transaksi</div>}
        />,
      );

      expect(screen.getByTestId('custom-footer')).toBeInTheDocument();
      expect(screen.getByText('Catatan Keamanan Transaksi')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // [AC-05] Dynamic Error Presentation
  // Detail:
  // - Jika terdapat error validasi dari consumer (errors.amount atau errors.description),
  //   field harus ditandai aria-invalid="true" dan pesan error tampil di helper text
  // =========================================================================
  describe('[AC-05] Dynamic Error Presentation', () => {
    // TC-10: Menampilkan pesan error validasi per-field
    it('TC-10 [AC-05]: should display error messages and mark fields invalid with aria-invalid when errors prop is provided', () => {
      const errors = {
        amount: 'Nominal minimal Rp 10.000',
        description: 'Keterangan wajib diisi',
      };

      render(<TransactionForm {...defaultProps} errors={errors} />);

      expect(screen.getByText('Nominal minimal Rp 10.000')).toBeInTheDocument();
      expect(screen.getByText('Keterangan wajib diisi')).toBeInTheDocument();

      const amountInput = screen.getByLabelText(/Nominal/i);
      const descriptionInput = screen.getByLabelText(/Keterangan/i);

      expect(amountInput).toHaveAttribute('aria-invalid', 'true');
      expect(descriptionInput).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
