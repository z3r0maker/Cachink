/**
 * Cancelaciones screen tests — SaleCancelCard + cancellation steps coverage.
 *
 * Covers sale display, cancel button, PIN step, reason step, cash confirm step.
 * B3: CancellationFlow orchestrator integration test (step-machine wiring).
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import type { Sale, SaleId, BusinessId, DeviceId, UserId } from '@cachink/domain';
import { makeSale, InMemorySalesRepository, InMemoryCancelacionLogsRepository } from '@cachink/testing';
import { MockRepositoryProvider } from '@cachink/testing/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppConfigStore } from '../../src/app-config/use-app-config';
import { SaleCancelCard } from '../../src/screens/Cancelaciones/sale-cancel-card';
import {
  PinStep,
  ReasonStep,
  CashConfirmStep,
} from '../../src/screens/Cancelaciones/cancellation-steps';
import { CancellationFlow } from '../../src/screens/Cancelaciones/cancellation-flow';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

initI18n();

const ACTIVE_SALE = makeSale({
  id: '01JPHK000000000000SALE0001' as SaleId,
  concepto: 'Taco al pastor',
  monto: 4500n,
  metodo: 'Efectivo',
  hora: '10:30',
  cancelledAt: null,
  cancelMotivo: null,
});

const CANCELLED_SALE = makeSale({
  id: '01JPHK000000000000SALE0002' as SaleId,
  concepto: 'Quesadilla',
  monto: 3000n,
  metodo: 'Efectivo',
  hora: '11:00',
  cancelledAt: '2026-06-15T12:00:00.000Z' as any,
  cancelMotivo: 'Cliente no pagó',
});

describe('SaleCancelCard', () => {
  it('renders the sale concepto', () => {
    renderWithProviders(
      <SaleCancelCard sale={ACTIVE_SALE} testID="test-card" />,
    );
    expect(screen.getByText('Taco al pastor')).toBeInTheDocument();
  });

  it('renders the formatted amount', () => {
    renderWithProviders(
      <SaleCancelCard sale={ACTIVE_SALE} testID="test-card" />,
    );
    expect(screen.getByText('$45.00')).toBeInTheDocument();
  });

  it('shows cancel button when sale is active and onCancel is provided', () => {
    renderWithProviders(
      <SaleCancelCard sale={ACTIVE_SALE} onCancel={vi.fn()} testID="test-card" />,
    );
    expect(screen.getByTestId(`cancel-btn-${ACTIVE_SALE.id}`)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is pressed', () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <SaleCancelCard sale={ACTIVE_SALE} onCancel={onCancel} testID="test-card" />,
    );
    fireEvent.click(screen.getByTestId(`cancel-btn-${ACTIVE_SALE.id}`));
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not show cancel button when sale is cancelled', () => {
    renderWithProviders(
      <SaleCancelCard sale={CANCELLED_SALE} onCancel={vi.fn()} testID="test-card" />,
    );
    expect(screen.queryByTestId(`cancel-btn-${CANCELLED_SALE.id}`)).toBeNull();
  });

  it('shows cancellation badge for cancelled sales', () => {
    renderWithProviders(
      <SaleCancelCard sale={CANCELLED_SALE} testID="test-card" />,
    );
    expect(screen.getByText(/Cliente no pagó/)).toBeInTheDocument();
  });

  it('does not show cancel button when onCancel is not provided', () => {
    renderWithProviders(
      <SaleCancelCard sale={ACTIVE_SALE} testID="test-card" />,
    );
    expect(screen.queryByTestId(`cancel-btn-${ACTIVE_SALE.id}`)).toBeNull();
  });

  it('renders with custom testID', () => {
    renderWithProviders(
      <SaleCancelCard sale={ACTIVE_SALE} testID="my-card" />,
    );
    expect(screen.getByTestId('my-card')).toBeInTheDocument();
  });
});

describe('PinStep', () => {
  it('renders the PIN input', () => {
    renderWithProviders(<PinStep onSubmit={vi.fn()} />);
    expect(screen.getByTestId('cancel-pin-input')).toBeInTheDocument();
  });

  it('renders the instruction text', () => {
    renderWithProviders(<PinStep onSubmit={vi.fn()} />);
    expect(screen.getByText(/Ingresa tu PIN/)).toBeInTheDocument();
  });
});

describe('ReasonStep', () => {
  it('renders the reason input', () => {
    renderWithProviders(
      <ReasonStep motivo="" onChangeMotivo={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByTestId('cancel-reason-input')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderWithProviders(
      <ReasonStep motivo="" onChangeMotivo={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByTestId('cancel-reason-submit')).toBeInTheDocument();
  });

  it('disables submit when motivo is empty', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ReasonStep motivo="" onChangeMotivo={vi.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.click(screen.getByTestId('cancel-reason-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('enables submit when motivo is filled', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <ReasonStep motivo="Cliente cambió de opinión" onChangeMotivo={vi.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.click(screen.getByTestId('cancel-reason-submit'));
    expect(onSubmit).toHaveBeenCalled();
  });

  it('renders the question text', () => {
    renderWithProviders(
      <ReasonStep motivo="" onChangeMotivo={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(screen.getByText('¿Por qué cancelas esta venta?')).toBeInTheDocument();
  });
});

describe('CashConfirmStep', () => {
  it('renders the confirm button', () => {
    renderWithProviders(
      <CashConfirmStep amount={4500n} onConfirm={vi.fn()} submitting={false} />,
    );
    expect(screen.getByTestId('cancel-cash-confirm')).toBeInTheDocument();
  });

  it('displays the formatted amount to return', () => {
    renderWithProviders(
      <CashConfirmStep amount={4500n} onConfirm={vi.fn()} submitting={false} />,
    );
    expect(screen.getByText(/\$45\.00/)).toBeInTheDocument();
  });

  it('calls onConfirm when button is clicked', () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <CashConfirmStep amount={4500n} onConfirm={onConfirm} submitting={false} />,
    );
    fireEvent.click(screen.getByTestId('cancel-cash-confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('shows disclaimer text about cash deduction', () => {
    renderWithProviders(
      <CashConfirmStep amount={4500n} onConfirm={vi.fn()} submitting={false} />,
    );
    expect(screen.getByText(/efectivo será descontado/)).toBeInTheDocument();
  });
});

// ─────────────────────────────────────────────────────────────
// B3: CancellationFlow orchestrator — step-machine wiring test
// ─────────────────────────────────────────────────────────────

const TEST_DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const TEST_BIZ = '01HZ8XQN9GZJXV8AKQ5X0BUSIN' as BusinessId;
const TEST_USER = '01HZ8XQN9GZJXV8AKQ5XUSER01' as UserId;

/** Drill into a Tamagui Input wrapper to find the native <input>. */
function getInput(testId: string): HTMLInputElement {
  return screen.getByTestId(testId).querySelector('input') as HTMLInputElement;
}

function renderFlow(
  sale: Sale,
  overrides: { sales: InMemorySalesRepository; cancelacionLogs: InMemoryCancelacionLogsRepository },
  callbacks: { onClose: () => void; onSuccess: () => void },
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
  useAppConfigStore.setState({
    currentBusinessId: TEST_BIZ,
    userId: TEST_USER,
    deviceId: TEST_DEV,
    hydrated: true,
  });
  return renderWithProviders(
    <QueryClientProvider client={qc}>
      <MockRepositoryProvider overrides={overrides}>
        <CancellationFlow
          sale={sale}
          onClose={callbacks.onClose}
          onSuccess={callbacks.onSuccess}
        />
      </MockRepositoryProvider>
    </QueryClientProvider>,
  );
}

describe('CancellationFlow (orchestrator)', () => {
  afterEach(() => {
    useAppConfigStore.getState().reset();
  });

  it('walks PIN → reason → cash-confirm for a cash sale and calls onSuccess', async () => {
    const sales = new InMemorySalesRepository(TEST_DEV);
    const cancelacionLogs = new InMemoryCancelacionLogsRepository(TEST_DEV);
    const sale = makeSale({
      monto: 4500n,
      metodo: 'Efectivo',
      hora: '10:30',
      cancelledAt: null,
      cancelMotivo: null,
      businessId: TEST_BIZ,
    });
    // Persist the sale so the repo.delete() call succeeds.
    await sales.create({
      fecha: sale.fecha,
      concepto: sale.concepto,
      categoria: sale.categoria,
      monto: sale.monto,
      metodo: sale.metodo,
      clienteId: sale.clienteId,
      estadoPago: sale.estadoPago,
      productoId: sale.productoId,
      cantidad: sale.cantidad,
      businessId: sale.businessId,
      cajaTurnoId: sale.cajaTurnoId,
    });

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderFlow(sale, { sales, cancelacionLogs }, { onClose, onSuccess });

    // Step 1: PIN step visible.
    expect(screen.getByTestId('cancel-pin-input')).toBeInTheDocument();
    expect(screen.queryByTestId('cancel-reason-input')).toBeNull();

    // Enter 6-digit PIN via the hidden input field.
    const pinField = screen.getByTestId('cancel-pin-input-field');
    fireEvent.change(pinField, { target: { value: '123456' } });

    // Step 2: Reason step should now be visible.
    await waitFor(() => {
      expect(screen.getByTestId('cancel-reason-input')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cancel-pin-input')).toBeNull();

    // Enter motivo via the native <input> inside the Input wrapper.
    fireEvent.change(getInput('cancel-reason-input'), { target: { value: 'Prueba integración' } });

    await waitFor(() => {
      expect(screen.getByTestId('cancel-reason-submit')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('cancel-reason-submit'));

    // Step 3: Cash confirm step should now be visible (cash sale).
    await waitFor(() => {
      expect(screen.getByTestId('cancel-cash-confirm')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('cancel-reason-input')).toBeNull();

    // Confirm cash return → triggers execution.
    fireEvent.click(screen.getByTestId('cancel-cash-confirm'));

    // Assert onSuccess was called (cancellation executed).
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('skips cash-confirm for non-cash sales and executes immediately after reason', async () => {
    const sales = new InMemorySalesRepository(TEST_DEV);
    const cancelacionLogs = new InMemoryCancelacionLogsRepository(TEST_DEV);
    const sale = makeSale({
      monto: 3000n,
      metodo: 'Tarjeta',
      hora: '14:00',
      cancelledAt: null,
      cancelMotivo: null,
      businessId: TEST_BIZ,
    });
    await sales.create({
      fecha: sale.fecha,
      concepto: sale.concepto,
      categoria: sale.categoria,
      monto: sale.monto,
      metodo: sale.metodo,
      clienteId: sale.clienteId,
      estadoPago: sale.estadoPago,
      productoId: sale.productoId,
      cantidad: sale.cantidad,
      businessId: sale.businessId,
      cajaTurnoId: sale.cajaTurnoId,
    });

    const onClose = vi.fn();
    const onSuccess = vi.fn();

    renderFlow(sale, { sales, cancelacionLogs }, { onClose, onSuccess });

    // Step 1: PIN.
    const pinField = screen.getByTestId('cancel-pin-input-field');
    fireEvent.change(pinField, { target: { value: '654321' } });

    // Step 2: Reason.
    await waitFor(() => {
      expect(screen.getByTestId('cancel-reason-input')).toBeInTheDocument();
    });
    fireEvent.change(getInput('cancel-reason-input'), { target: { value: 'Tarjeta rechazada' } });
    fireEvent.click(screen.getByTestId('cancel-reason-submit'));

    // Non-cash → skips cash-confirm, executes immediately.
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledTimes(1);
    });
    // Cash confirm step should never have appeared.
    expect(screen.queryByTestId('cancel-cash-confirm')).toBeNull();
  });
});
