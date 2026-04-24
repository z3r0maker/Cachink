/**
 * PendientesCard tests (Slice 2 C7, M4-T04).
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  BusinessId,
  DeviceId,
  IsoDate,
  IsoTimestamp,
  RecurringExpense,
  RecurringExpenseId,
} from '@cachink/domain';
import { PendientesCard } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

function pendiente(overrides: Partial<RecurringExpense> = {}): RecurringExpense {
  return {
    id: '01JPHK0000000000000000RE01' as RecurringExpenseId,
    concepto: 'Renta',
    categoria: 'Renta',
    montoCentavos: 50000n,
    proveedor: null,
    frecuencia: 'mensual',
    diaDelMes: 1,
    diaDeLaSemana: null,
    proximoDisparo: '2026-04-24' as IsoDate,
    activo: true,
    businessId: '01JPHK00000000000000000008' as BusinessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

describe('PendientesCard', () => {
  it('returns null when no pendientes are due', () => {
    const { container } = renderWithProviders(
      <PendientesCard pendientes={[]} onConfirmar={vi.fn()} />,
    );
    expect(container.querySelector('[data-testid="pendientes-card"]')).toBeNull();
  });

  it('renders one row per pendiente', () => {
    const items = [
      pendiente({ id: '01JPHK0000000000000000RE01' as RecurringExpenseId, concepto: 'Renta' }),
      pendiente({ id: '01JPHK0000000000000000RE02' as RecurringExpenseId, concepto: 'Luz' }),
    ];
    renderWithProviders(<PendientesCard pendientes={items} onConfirmar={vi.fn()} />);
    expect(screen.getByTestId('pendiente-01JPHK0000000000000000RE01')).toBeInTheDocument();
    expect(screen.getByTestId('pendiente-01JPHK0000000000000000RE02')).toBeInTheDocument();
  });

  it('fires onConfirmar with the pendiente when Confirmar is tapped', () => {
    const onConfirmar = vi.fn();
    const p = pendiente();
    renderWithProviders(<PendientesCard pendientes={[p]} onConfirmar={onConfirmar} />);
    const btn = screen.getAllByTestId(`pendiente-confirmar-${p.id}`)[0]!;
    fireEvent.click(btn);
    expect(onConfirmar).toHaveBeenCalledWith(p);
  });

  it('hides Descartar when no onDescartar callback is provided', () => {
    const p = pendiente();
    renderWithProviders(<PendientesCard pendientes={[p]} onConfirmar={vi.fn()} />);
    expect(screen.queryByTestId(`pendiente-descartar-${p.id}`)).toBeNull();
  });
});
