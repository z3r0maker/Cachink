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
} from '@cachink/domain';
import { NominaTab, NuevoEmpleadoModal } from '../../src/screens/index';
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
  it('renders empty-state Btn when no empleados exist', () => {
    renderWithProviders(
      <NominaTab
        businessId={businessId}
        fecha={fecha}
        empleados={[]}
        onSubmit={vi.fn()}
        onCrearEmpleado={vi.fn(async () => empleado())}
      />,
    );
    expect(screen.getByTestId('nomina-crear-empleado')).toBeInTheDocument();
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

describe('NuevoEmpleadoModal', () => {
  it('renders nombre, puesto, salario, periodo fields when open', () => {
    renderWithProviders(<NuevoEmpleadoModal open onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByTestId('empleado-nombre')).toBeInTheDocument();
    expect(screen.getByTestId('empleado-puesto')).toBeInTheDocument();
    expect(screen.getByTestId('empleado-salario')).toBeInTheDocument();
    expect(screen.getByTestId('empleado-periodo')).toBeInTheDocument();
  });

  it('blocks submit with empty nombre', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<NuevoEmpleadoModal open onClose={vi.fn()} onSubmit={onSubmit} />);
    const submit = screen.getAllByTestId('empleado-submit')[0]!;
    fireEvent.click(submit);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
