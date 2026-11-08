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
  // [AC-01] Validasi Nominal
  // Detail:
  // - Field Nominal hanya menerima angka positif dengan nilai minimum Rp 10.000 dan maksimum Rp 100.000.000.000 (100 Miliar)
  // - Bila nilai nominal bernilai 0 atau dikosongkan, input harus menampilkan string kosong, bukan angka 0 telanjang
  // =========================================================================
  describe('[AC-01] Validasi Nominal', () => {
    // TC-AC01-01: Pengubahan nilai nominal transaksi yang valid (Boundary & Range)
    it('TC-AC01-01 [AC-01]: should trigger onAmountChange and onChange when typing valid amount input', async () => {
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

    // TC-AC01-02: Validasi batas nominal (maksimum 100 Miliar dan non-negatif)
    it('TC-AC01-02 [AC-01]: should not trigger callbacks when amount exceeds limit (>100B) or is negative', () => {
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

    // TC-AC01-03: Render nominal dengan nilai 0 (zero) menghasilkan string kosong
    it('TC-AC01-03 [AC-01]: should render empty string for amount when value is 0 or "0"', () => {
      const { rerender } = render(
        <TransactionForm
          {...defaultProps}
          values={{ amount: 0, description: '' }}
        />,
      );

      const amountInput = screen.getByLabelText(/Nominal/i) as HTMLInputElement;
      expect(amountInput.value).toBe('');

      // Uji juga nilai string "0" sesuai rekomendasi QC Service
      rerender(
        <TransactionForm
          {...defaultProps}
          values={{ amount: '0', description: '' }}
        />,
      );
      expect(amountInput.value).toBe('');
    });

    // TC-AC01-04: Pengosongan nilai nominal transaksi mereset nilai ke 0
    it('TC-AC01-04 [AC-01]: should trigger onAmountChange with 0 and onChange with 0 when amount input is cleared', async () => {
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

    // TC-AC01-05: Penanganan pengubahan nilai nominal jika callback opsional tidak disediakan
    it('TC-AC01-05 [AC-01]: should handle amount change when optional callbacks are not provided', async () => {
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
  });

  // =========================================================================
  // [AC-02] Proteksi Idempotency & Double Submission
  // Detail:
  // - Saat proses transaksi berlangsung (isLoading = true), tombol submit menampilkan spinner & loadingText, form disabled
  // - Trigger submit saat isLoading atau disabled tidak boleh mengeksekusi onSubmit
  // =========================================================================
  describe('[AC-02] Proteksi Idempotency & Double Submission', () => {
    // TC-AC02-01: Proteksi submit dan visual state saat kondisi isLoading
    it('TC-AC02-01 [AC-02]: should disable submit button, show loadingText and CircularProgress, and prevent onSubmit when isLoading is true', () => {
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

    // TC-AC02-02: Proteksi submit saat kondisi disabled
    it('TC-AC02-02 [AC-02]: should disable all inputs and submit button, and prevent onSubmit when disabled is true', () => {
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
    // TC-AC03-01: Pengubahan teks keterangan transaksi memicu callback
    it('TC-AC03-01 [AC-03]: should trigger onDescriptionChange and onChange when typing in description input', async () => {
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
      expect(descriptionInput).toHaveAttribute('maxlength', '255');
      await user.type(descriptionInput, 'Transfer tagihan');

      expect(handleDescriptionChange).toHaveBeenCalled();
      expect(handleChange).toHaveBeenCalledWith('description', expect.any(String));
    });

    // TC-AC03-02: Penanganan input keterangan saat callback opsional tidak disediakan
    it('TC-AC03-02 [AC-03]: should handle description change when optional callbacks are not provided', async () => {
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
    // TC-AC04-01: Injeksi komponen kustom pada slot children di atas field nominal
    it('TC-AC04-01 [AC-04]: should render custom injected children slot above nominal input', () => {
      render(
        <TransactionForm {...defaultProps}>
          <div data-testid="custom-account-selector">Pilih Rekening Sumber</div>
        </TransactionForm>,
      );

      expect(screen.getByTestId('custom-account-selector')).toBeInTheDocument();
      expect(screen.getByText('Pilih Rekening Sumber')).toBeInTheDocument();
    });

    // TC-AC04-02: Injeksi komponen pada slot footer di bawah tombol submit
    it('TC-AC04-02 [AC-04]: should render custom footer slot below submit button', () => {
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
    // TC-AC05-01: Menampilkan pesan error validasi per-field dan tanda aria-invalid
    it('TC-AC05-01 [AC-05]: should display error messages and mark fields invalid with aria-invalid when errors prop is provided', () => {
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

  // =========================================================================
  // CORE RENDERING & FORM DEFAULTS
  // =========================================================================
  describe('Core Component Rendering & Form Defaults', () => {
    // TC-CORE-01: Render default dengan konfigurasi minimum
    it('TC-CORE-01: should render correctly with default props', () => {
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

    // TC-CORE-02: Sembunyikan header jika hideHeader bernilai true
    it('TC-CORE-02: should not render header when hideHeader is true', () => {
      render(<TransactionForm {...defaultProps} hideHeader={true} />);

      expect(screen.queryByText('Formulir Transaksi')).not.toBeInTheDocument();
      expect(screen.queryByText('Bank Syariah Indonesia')).not.toBeInTheDocument();
      expect(screen.queryByTestId('AccountBalanceIcon')).not.toBeInTheDocument();
    });

    // TC-CORE-03: Kustomisasi teks header & subjudul kosong
    it('TC-CORE-03: should render custom title and omit subtitle when subtitle is empty', () => {
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

    // TC-CORE-04: Submit formulir pada kondisi normal
    it('TC-CORE-04: should call onSubmit when submitting the form under normal conditions', async () => {
      const user = userEvent.setup();
      const handleSubmit = jest.fn();

      render(<TransactionForm {...defaultProps} onSubmit={handleSubmit} />);

      const submitBtn = screen.getByRole('button', { name: 'Kirim Transaksi' });
      await user.click(submitBtn);

      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });
});
