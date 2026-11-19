/**
 * The Inventario movement sheet (RvInventario; M9, item 6): one sheet on the
 * product the row was, opened on the kind its stock calls for. The quantity
 * is typed or stepped, a merma never takes more than there is and always
 * says what happened. The write goes through `onGuardar`; a failed one stays
 * open to be corrected.
 */
import { describe, expect, it, vi } from 'vitest';
import { INVENTARIO_FIXTURE, type TipoMovimiento } from '@xangarro/caja/inventario';
import { initI18n } from '../src/i18n/index';
import { MovimientoSheet } from '../src/screens/Inventario/mover-sheet';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const item = (id: string) => INVENTARIO_FIXTURE.existencias.find((e) => e.id === id)!;
const FIRMA = 'Ana Robledo, Caja 1';

const escribir = (testID: string, texto: string): void => {
  fireEvent.change(screen.getByTestId(testID), { target: { value: texto } });
};
const textoDe = (testID: string): string => (screen.getByTestId(testID).textContent ?? '').trim();
const valorDe = (testID: string): string => (screen.getByTestId(testID) as HTMLInputElement).value;

function montar(id: string, tipo: TipoMovimiento, onGuardar = vi.fn(() => Promise.resolve())) {
  const onClose = vi.fn();
  renderWithProviders(
    <MovimientoSheet
      item={item(id)}
      tipo={tipo}
      firma={FIRMA}
      onClose={onClose}
      onGuardar={onGuardar}
    />,
  );
  return { onGuardar, onClose };
}

describe('MovimientoSheet · llegó mercancía', () => {
  it('opens on the product and its stock, five already written', () => {
    montar('pastor', 'Entrada');
    expect(screen.getByText('¿Qué pasó con la mercancía?')).toBeInTheDocument();
    expect(screen.getByText('Hay 8 kg · aviso en 15 kg')).toBeInTheDocument();
    expect(screen.getByTestId('mover-tipo-Entrada').getAttribute('aria-checked')).toBe('true');
    expect(valorDe('mover-cantidad')).toBe('5');
    expect(textoDe('mover-guardar')).toBe('Registrar entrada de 5 kg');
  });

  it('happy path: a typed quantity, one tap, and the sheet closes', async () => {
    const { onGuardar, onClose } = montar('pastor', 'Entrada');
    escribir('mover-cantidad', '24');
    expect(textoDe('mover-quedan')).toBe('Vas a tener 32 kg');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: 'Entrada',
      existenciaId: 'pastor',
      cantidad: 24,
      detalle: '',
    });
  });

  it('refuses zero and an empty field', () => {
    const { onGuardar } = montar('pastor', 'Entrada');
    escribir('mover-cantidad', '0');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    escribir('mover-cantidad', '');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('keeps digits only: a typed dot or letter never reaches the field', () => {
    montar('pastor', 'Entrada');
    escribir('mover-cantidad', '1.5kg');
    expect(valorDe('mover-cantidad')).toBe('15');
  });

  it('the steppers move by one', () => {
    montar('pastor', 'Entrada');
    fireEvent.click(screen.getByTestId('mover-mas'));
    expect(valorDe('mover-cantidad')).toBe('6');
    fireEvent.click(screen.getByTestId('mover-menos'));
    fireEvent.click(screen.getByTestId('mover-menos'));
    expect(valorDe('mover-cantidad')).toBe('4');
  });
});

describe('MovimientoSheet · merma (M9)', () => {
  it('a merma over the stock says «Solo hay» and cannot be recorded', () => {
    const { onGuardar } = montar('horchata', 'Merma');
    escribir('mover-cantidad', '12');
    fireEvent.click(screen.getByTestId('mover-motivo-Se echó a perder'));
    expect(textoDe('mover-quedan')).toBe('Solo hay 9 litros.');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('the plus button stops at the stock', () => {
    montar('horchata', 'Merma');
    escribir('mover-cantidad', '9');
    fireEvent.click(screen.getByTestId('mover-mas'));
    expect(valorDe('mover-cantidad')).toBe('9');
  });

  it('waits for what happened', () => {
    const { onGuardar } = montar('horchata', 'Merma');
    escribir('mover-cantidad', '2');
    fireEvent.click(screen.getByTestId('mover-guardar'));
    expect(onGuardar).not.toHaveBeenCalled();
  });

  it('happy path: the merma carries what happened as its detalle', async () => {
    const { onGuardar, onClose } = montar('horchata', 'Merma');
    escribir('mover-cantidad', '9');
    fireEvent.click(screen.getByTestId('mover-motivo-Se rompió'));
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onGuardar).toHaveBeenCalledWith({
      tipo: 'Merma',
      existenciaId: 'horchata',
      cantidad: 9,
      detalle: 'Se rompió',
    });
  });

  it('switching the kind starts its quantity over', () => {
    montar('pastor', 'Entrada');
    escribir('mover-cantidad', '24');
    fireEvent.click(screen.getByTestId('mover-tipo-Merma'));
    expect(valorDe('mover-cantidad')).toBe('1');
    expect(screen.getByText('¿Qué le pasó?')).toBeInTheDocument();
  });

  it('a failed write says so and stays open', async () => {
    const { onClose } = montar(
      'horchata',
      'Merma',
      vi.fn(() => Promise.reject(new Error('sin negocio'))),
    );
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
