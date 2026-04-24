/**
 * EgresoDetailPopover tests (Slice 2 C9).
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
import { EgresoDetailPopover } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const egreso: Expense = {
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
};

describe('EgresoDetailPopover', () => {
  it('returns null when egreso is null', () => {
    const { container } = renderWithProviders(
      <EgresoDetailPopover open egreso={null} onClose={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(container.querySelector('[data-testid="egreso-detail-popover"]')).toBeNull();
  });

  it('renders delete Btn when egreso is set and open', () => {
    renderWithProviders(
      <EgresoDetailPopover open egreso={egreso} onClose={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(screen.getByTestId('egreso-detail-delete')).toBeInTheDocument();
  });

  it('fires onDelete when Eliminar is tapped', () => {
    const onDelete = vi.fn();
    renderWithProviders(
      <EgresoDetailPopover open egreso={egreso} onClose={vi.fn()} onDelete={onDelete} />,
    );
    const btn = screen.getAllByTestId('egreso-detail-delete')[0]!;
    fireEvent.click(btn);
    expect(onDelete).toHaveBeenCalled();
  });
});
