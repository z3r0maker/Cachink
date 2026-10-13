/**
 * The two Gastos sheets (Track M, M-08): the web drawer's rules on the
 * phone — what, how much and the category are required — the pagar sheet
 * filled from a due template, the write going through `onGuardar`, and the
 * failure that stays open to be corrected.
 */
import { describe, expect, it, vi } from 'vitest';
import type { RecurringExpense } from '@xangarro/domain';
import { RECURRENTE_PAGAR_FIXTURE } from '@xangarro/caja/gastos';
import { initI18n } from '../src/i18n/index';
import { PagarRecurrenteSheet } from '../src/screens/Gastos/pagar-recurrente-sheet';
import { RegistrarGastoSheet } from '../src/screens/Gastos/registrar-gasto-sheet';
import { recurrentesPorPagar } from '../src/screens/Gastos/gastos-lectura';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const FIRMA = 'Ana Robledo, Caja 1';

const escribir = (testID: string, texto: string): void => {
  fireEvent.change(screen.getByTestId(testID), { target: { value: texto } });
};

const textoDe = (testID: string): string => (screen.getByTestId(testID).textContent ?? '').trim();

function montarRegistrar(onGuardar = vi.fn(() => Promise.resolve())) {
  const onClose = vi.fn();
  renderWithProviders(
    <RegistrarGastoSheet open firma={FIRMA} onClose={onClose} onGuardar={onGuardar} />,
  );
  return { onGuardar, onClose };
}

function llenar(monto: string, concepto: string, categoria: string): void {
  escribir('gasto-monto', monto);
  escribir('gasto-concepto', concepto);
  fireEvent.click(screen.getByTestId(`gasto-categoria-${categoria}`));
}

describe('RegistrarGastoSheet · validación', () => {
  it('waits for the monto: blocked at zero, at junk, at three decimals', () => {
    const { onGuardar } = montarRegistrar();
    expect(textoDe('gasto-guardar')).toContain('Registrar gasto de $___');
    llenar('0.00', 'Cilindro de gas', 'Insumos');
    expect(textoDe('gasto-guardar')).toContain('$___');
    escribir('gasto-monto', '12.345');
    expect(textoDe('gasto-guardar')).toContain('$___');
    fireEvent.click(screen.getByTestId('gasto-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('waits for the concepto', () => {
    const { onGuardar } = montarRegistrar();
    llenar('150', '   ', 'Insumos');
    fireEvent.click(screen.getByTestId('gasto-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('waits for the categoría', () => {
    const { onGuardar } = montarRegistrar();
    escribir('gasto-monto', '150');
    escribir('gasto-concepto', 'Cilindro de gas');
    fireEvent.click(screen.getByTestId('gasto-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('happy path: registers the centavos, the trimmed concepto and the categoría', async () => {
    const { onGuardar, onClose } = montarRegistrar();
    llenar('150', 'Cilindro de gas', 'Insumos');
    escribir('gasto-proveedor', ' Gas Express ');
    expect(textoDe('gasto-guardar')).toContain('Registrar gasto de $150.00');
    fireEvent.click(screen.getByTestId('gasto-guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onGuardar).toHaveBeenCalledWith({
      monto: 150_00n,
      concepto: 'Cilindro de gas',
      categoria: 'Insumos',
      proveedor: 'Gas Express',
      foto: null,
    });
  });

  it('a failed write says so and stays open', async () => {
    const { onClose } = montarRegistrar(vi.fn(() => Promise.reject(new Error('sin turno'))));
    llenar('150', 'Cilindro de gas', 'Insumos');
    fireEvent.click(screen.getByTestId('gasto-guardar'));
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo registrar el gasto. Revísalo y vuelve a intentarlo.'),
      ).toBeInTheDocument(),
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

function montarPagar(onGuardar = vi.fn(() => Promise.resolve())) {
  const onClose = vi.fn();
  renderWithProviders(
    <PagarRecurrenteSheet
      open
      x={RECURRENTE_PAGAR_FIXTURE}
      firma={FIRMA}
      onClose={onClose}
      onGuardar={onGuardar}
    />,
  );
  return { onGuardar, onClose };
}

describe('PagarRecurrenteSheet', () => {
  it('opens filled with the template and says when it was due', () => {
    montarPagar();
    expect(screen.getByText('Pagar gas del local')).toBeInTheDocument();
    expect(screen.getByTestId('pagar-recurrente-tarjeta').textContent).toContain('Vence hoy');
    expect(textoDe('gasto-guardar')).toContain('Registrar gasto de $350.00');
    expect((screen.getByTestId('gasto-concepto') as HTMLInputElement).value).toBe('Gas del local');
  });

  it('one write pays the template: the recurrenteId rides along', async () => {
    const { onGuardar, onClose } = montarPagar();
    fireEvent.click(screen.getByTestId('gasto-guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onGuardar).toHaveBeenCalledWith(
      expect.objectContaining({ recurrenteId: 'r-gas', monto: 350_00n, concepto: 'Gas del local' }),
    );
  });
});

describe('recurrentesPorPagar (el emparejamiento de la lectura)', () => {
  const plantilla: RecurringExpense = {
    id: 'r-gas',
    concepto: 'Gas del local',
    categoria: 'Materia Prima',
    montoCentavos: 350_00n,
    proveedor: 'Gas Express',
    frecuencia: 'semanal',
    diaDelMes: null,
    diaDeLaSemana: 5,
    proximoDisparo: '2026-10-06',
    activo: true,
    businessId: 'biz',
    deviceId: 'dev',
    createdByUserId: null,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:00:00.000Z',
    deletedAt: null,
  };

  it('pairs the row the list shows with what its sheet opens with', () => {
    const [x] = recurrentesPorPagar([plantilla], '2026-10-06');
    expect(x?.para.concepto).toBe('Gas del local');
    expect(x?.para.vence).toBe(0);
    expect(x?.prefill.categoria).toBe('Insumos');
    expect(x?.prefill.monto).toBe(350_00n);
  });

  it('a template due yesterday is atrasado', () => {
    const [x] = recurrentesPorPagar([{ ...plantilla, proximoDisparo: '2026-10-05' }], '2026-10-06');
    expect(x?.para.vence).toBe(-1);
  });
});
