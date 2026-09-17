/**
 * NominaTab tests (Slice 2 C4).
 */

import { describe, expect, it, vi } from 'vitest';
import type {
  BusinessId,
  DeviceId,
  Employee,
  EmployeeId,
  IsoDate,
  IsoTimestamp,
} from '@xangarro/domain';
import { NominaTab } from '../../src/screens/index';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

const businessId = '01JPHK00000000000000000008' as BusinessId;
const fecha = '2026-04-24' as IsoDate;

function empleado(overrides: Partial<Employee> = {}): Employee {
  return {
    id: '01JPHK0000000000000000P001' as EmployeeId,
    nombre: 'Ana Pérez',
    puesto: 'Cocinera',
    salarioCentavos: 500000n,
    periodo: 'quincenal',
    businessId,
    deviceId: '01JPHK00000000000000000007' as DeviceId,
    createdAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    updatedAt: '2026-04-24T00:00:00Z' as IsoTimestamp,
    deletedAt: null,
    ...overrides,
  };
}

describe('NominaTab', () => {
  it('points to the portal when no empleados exist — the device never creates them', () => {
    renderWithProviders(
      <NominaTab businessId={businessId} fecha={fecha} empleados={[]} onSubmit={vi.fn()} />,
    );
    expect(screen.getByTestId('nomina-sin-empleados')).toBeInTheDocument();
    expect(screen.queryByTestId('nomina-crear-empleado')).toBeNull();
  });

  it('renders empleado select when empleados exist', () => {
    renderWithProviders(
      <NominaTab
        businessId={businessId}
        fecha={fecha}
        empleados={[empleado()]}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByTestId('nomina-empleado')).toBeInTheDocument();
    expect(screen.getByTestId('nomina-monto')).toBeInTheDocument();
  });

  it('shows employee name in the picker, not the raw ID', () => {
    const emp = empleado();
    renderWithProviders(
      <NominaTab businessId={businessId} fecha={fecha} empleados={[emp]} onSubmit={vi.fn()} />,
    );
    const picker = screen.getByTestId('nomina-empleado');
    expect(picker.textContent).not.toContain(emp.id);
  });

  it('blocks submit when no empleado is selected', () => {
    const onSubmit = vi.fn();
    renderWithProviders(
      <NominaTab
        businessId={businessId}
        fecha={fecha}
        empleados={[empleado()]}
        onSubmit={onSubmit}
      />,
    );
    const submit = screen.getAllByTestId('nomina-submit')[0]!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
