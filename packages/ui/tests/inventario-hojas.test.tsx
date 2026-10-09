/**
 * The two Inventario sheets (Track M, M-09): the board dialog's rules on
 * the phone — the product is picked, the quantity a whole number above
 * zero, and a merma always says what happened; an entrada may say who
 * brought it. The write goes through `onGuardar`; a failed one stays open
 * to be corrected.
 */
import { describe, expect, it, vi } from 'vitest';
import { INVENTARIO_FIXTURE } from '@xangarro/caja/inventario';
import { initI18n } from '../src/i18n/index';
import { LlegoMercanciaSheet } from '../src/screens/Inventario/llego-mercancia-sheet';
import { MermaSheet } from '../src/screens/Inventario/merma-sheet';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const ITEMS = INVENTARIO_FIXTURE.existencias;
const FIRMA = 'Ana Robledo, Caja 1';

const escribir = (testID: string, texto: string): void => {
  fireEvent.change(screen.getByTestId(testID), { target: { value: texto } });
};

const textoDe = (testID: string): string => (screen.getByTestId(testID).textContent ?? '').trim();

function montarLlego(onGuardar = vi.fn(() => Promise.resolve()), preselect: string | null = null) {
  const onClose = vi.fn();
  renderWithProviders(
    <LlegoMercanciaSheet
      open
      items={ITEMS}
      preselect={preselect}
      firma={FIRMA}
      onClose={onClose}
      onGuardar={onGuardar}
    />,
  );
  return { onGuardar, onClose };
}

function montarMerma(onGuardar = vi.fn(() => Promise.resolve()), preselect: string | null = null) {
  const onClose = vi.fn();
  renderWithProviders(
    <MermaSheet
      open
      items={ITEMS}
      preselect={preselect}
      firma={FIRMA}
      onClose={onClose}
      onGuardar={onGuardar}
    />,
  );
  return { onGuardar, onClose };
}

describe('LlegoMercanciaSheet · validación', () => {
  it('waits for the product, the amount, and refuses decimals and zero', () => {
    const { onGuardar } = montarLlego();
    escribir('mover-cantidad', '15');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
    escribir('mover-buscar', 'pastor');
    fireEvent.click(screen.getByTestId('mover-producto-Carne de pastor'));
    escribir('mover-cantidad', '1.5');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
    escribir('mover-cantidad', '0');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
    escribir('mover-cantidad', 'abc');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('happy path: the entrada says who brought it, trimmed; or nothing', async () => {
    const { onGuardar, onClose } = montarLlego();
    fireEvent.click(screen.getByTestId('mover-producto-Carne de pastor'));
    escribir('mover-cantidad', '15');
    escribir('mover-proveedor', ' Carnicería La Central ');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: 'Entrada',
      existenciaId: 'pastor',
      cantidad: 15,
      detalle: 'Carnicería La Central',
    });
  });

  it('an entrada without a supplier still records, with an empty detalle', async () => {
    const { onGuardar } = montarLlego();
    fireEvent.click(screen.getByTestId('mover-producto-Tortilla de maíz'));
    escribir('mover-cantidad', '300');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() => expect(onGuardar).toHaveBeenCalled());
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: 'Entrada',
      existenciaId: 'tortilla',
      cantidad: 300,
      detalle: '',
    });
  });

  it('a failed write says so and stays open', async () => {
    const { onClose } = montarLlego(vi.fn(() => Promise.reject(new Error('sin negocio'))));
    fireEvent.click(screen.getByTestId('mover-producto-Carne de pastor'));
    escribir('mover-cantidad', '15');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo registrar el movimiento. Revísalo y vuelve a intentarlo.'),
      ).toBeInTheDocument(),
    );
    expect(onClose).not.toHaveBeenCalled();
  });

  it('the picker searches and answers when nothing matches', () => {
    montarLlego();
    escribir('mover-buscar', 'oaxaca');
    expect(screen.getByTestId('mover-producto-Queso oaxaca')).toBeInTheDocument();
    expect(screen.queryByTestId('mover-producto-Carne de pastor')).not.toBeInTheDocument();
    escribir('mover-buscar', 'zzz');
    expect(screen.getByText('Nada coincide con esa búsqueda.')).toBeInTheDocument();
  });
});

describe('MermaSheet · validación', () => {
  it('waits for the product, the amount and the motivo', () => {
    const { onGuardar } = montarMerma();
    escribir('mover-cantidad', '2');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByTestId('mover-producto-Horchata preparada'));
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
    escribir('mover-cantidad', '0');
    fireEvent.click(screen.getByTestId('mover-motivo-Se echó a perder'));
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('happy path: the merma carries what happened as its detalle', async () => {
    const { onGuardar, onClose } = montarMerma();
    fireEvent.click(screen.getByTestId('mover-producto-Horchata preparada'));
    escribir('mover-cantidad', '2');
    fireEvent.click(screen.getByTestId('mover-motivo-Se rompió'));
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: 'Merma',
      existenciaId: 'horchata',
      cantidad: 2,
      detalle: 'Se rompió',
    });
  });

  it('a preselected product (the row quick square) starts picked', () => {
    montarMerma(undefined, 'queso');
    expect(screen.getByTestId('mover-producto-Queso oaxaca').getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(textoDe('merma-sheet')).toContain('Registrar merma');
  });

  it('a failed write says so and stays open', async () => {
    const { onClose } = montarMerma(vi.fn(() => Promise.reject(new Error('sin negocio'))));
    fireEvent.click(screen.getByTestId('mover-producto-Queso oaxaca'));
    escribir('mover-cantidad', '1');
    fireEvent.click(screen.getByTestId('mover-motivo-Se rompió'));
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo registrar el movimiento. Revísalo y vuelve a intentarlo.'),
      ).toBeInTheDocument(),
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
