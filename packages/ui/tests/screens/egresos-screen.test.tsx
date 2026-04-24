/**
 * EgresosScreen tests (Slice 2 C1, P1C-M4-T01).
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  BusinessId,
  DeviceId,
  Expense,
  ExpenseId,
  IsoDate,
  IsoTimestamp,
} from '@cachink/domain';
import { EgresosScreen } from '../../src/screens/index';
import { totalEgresosDelDia } from '../../src/hooks/use-total-egresos-del-dia';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function egreso(overrides: Partial<Expense> = {}): Expense {
  return {
    id: '01JPHK0000000000000000E001' as ExpenseId,
    fecha: '2026-04-24' as IsoDate,
    concepto: 'Renta',
    categoria: 'Renta',
    monto: 50000n,
    proveedor: 'Inmobiliaria X',
    gastoRecurrenteId: null,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

describe('totalEgresosDelDia', () => {
  it('returns 0n for an empty list', () => {
    expect(totalEgresosDelDia([])).toBe(0n);
  });

  it('sums the monto of every egreso', () => {
    expect(
      totalEgresosDelDia([
        egreso({ monto: 50000n }),
        egreso({ monto: 25000n, id: '01JPHK0000000000000000E002' as ExpenseId }),
      ]),
    ).toBe(75000n);
  });
});

describe('EgresosScreen', () => {
  it('renders the empty state when the list is empty', () => {
    renderWithProviders(
      <EgresosScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        egresos={[]}
        total={0n}
        onNuevoEgreso={vi.fn()}
      />,
    );
    expect(screen.getByTestId('empty-egresos')).toBeInTheDocument();
  });

  it('renders one EgresoCard per egreso and the formatted total with minus sign', () => {
    renderWithProviders(
      <EgresosScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        egresos={[
          egreso({ concepto: 'Renta mensual' }),
          egreso({ id: '01JPHK0000000000000000E002' as ExpenseId, concepto: 'Luz' }),
        ]}
        total={75000n}
        onNuevoEgreso={vi.fn()}
      />,
    );
    expect(screen.getByText('Renta mensual')).toBeInTheDocument();
    expect(screen.getByText('Luz')).toBeInTheDocument();
    expect(screen.getByTestId('egresos-total-card').textContent).toContain('−$750.00');
  });

  it('invokes onNuevoEgreso when the header Btn is tapped', () => {
    const onNuevoEgreso = vi.fn();
    renderWithProviders(
      <EgresosScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        egresos={[egreso()]}
        total={50000n}
        onNuevoEgreso={onNuevoEgreso}
      />,
    );
    const btn = screen.getAllByTestId('egresos-nuevo')[0]!;
    fireEvent.click(btn);
    expect(onNuevoEgreso).toHaveBeenCalled();
  });

  it('renders skeleton when loading', () => {
    renderWithProviders(
      <EgresosScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        egresos={[]}
        total={0n}
        onNuevoEgreso={vi.fn()}
        loading
      />,
    );
    expect(screen.getByTestId('egresos-skeleton-0')).toBeInTheDocument();
  });

  it('renders an error banner with retry when error prop is set', () => {
    const onRetry = vi.fn();
    renderWithProviders(
      <EgresosScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        egresos={[]}
        total={0n}
        onNuevoEgreso={vi.fn()}
        error={new Error('boom')}
        onRetry={onRetry}
      />,
    );
    const retryBtn = screen.getAllByTestId('egresos-retry')[0]!;
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders proveedor when set', () => {
    renderWithProviders(
      <EgresosScreen
        fecha="2026-04-24"
        onChangeFecha={vi.fn()}
        egresos={[egreso({ proveedor: 'Inmobiliaria X' })]}
        total={50000n}
        onNuevoEgreso={vi.fn()}
      />,
    );
    expect(screen.getByText('Inmobiliaria X')).toBeInTheDocument();
  });
});
