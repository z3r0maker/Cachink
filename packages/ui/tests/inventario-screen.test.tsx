/**
 * The Inventario screen (Track M, M-09; RvInventario) in its board states:
 * the existencias with their chips and regla, the turno's movements, the
 * search, sin productos with Don, cargando y error — plus the one tap per
 * row that opens the sheet on the kind its stock calls for, and the toast a
 * recorded movement leaves. Fed the caja design fixture.
 */
import { describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/react';
import { INVENTARIO_FIXTURE } from '@xangarro/caja/inventario';
import { initI18n } from '../src/i18n/index';
import { InventarioScreen } from '../src/screens/Inventario/inventario-screen';
import { fireEvent, renderWithProviders, screen, waitFor } from './test-utils';

initI18n();

const DATA = INVENTARIO_FIXTURE;

function montar(over: Partial<Parameters<typeof InventarioScreen>[0]> = {}) {
  const registrar = vi.fn(() => Promise.resolve());
  const onNuevoProducto = vi.fn();
  renderWithProviders(
    <InventarioScreen
      state="happy"
      data={DATA}
      dueno="Pedro"
      registrar={registrar}
      onNuevoProducto={onNuevoProducto}
      onRetry={() => undefined}
      {...over}
    />,
  );
  return { registrar, onNuevoProducto };
}

const textoDe = (testID: string): string => (screen.getByTestId(testID).textContent ?? '').trim();

describe('InventarioScreen · existencias', () => {
  it('says the three figures with their hints', () => {
    montar();
    expect(textoDe('inventario-kpis')).toContain('Por reponer');
    expect(textoDe('inventario-kpis')).toContain('4');
    expect(textoDe('inventario-kpis')).toContain('Entradas de hoy');
    expect(textoDe('inventario-kpis')).toContain('Pastor, tortilla y agua');
    expect(textoDe('inventario-kpis')).toContain('Mermas de hoy');
    expect(textoDe('inventario-kpis')).toContain('Horchata y queso oaxaca');
  });

  it('rows say the aviso with its unit, the chip and the count with its unit', () => {
    montar();
    expect(screen.getByText('Carne de pastor')).toBeInTheDocument();
    expect(screen.getByText('Aviso en 15 kg')).toBeInTheDocument();
    expect(textoDe('inventario-cantidad-pastor')).toBe('8 kg');
    expect(screen.getAllByText('Reponer').length).toBe(4);
    expect(screen.getAllByText('Suficiente').length).toBe(6);
  });

  it('carries the regla with the owner who adjusts stock from the portal', () => {
    montar();
    expect(textoDe('inventario-regla')).toContain(
      'el ajuste libre de existencias lo hace Pedro desde el portal',
    );
  });

  it('searches without accents and answers when nothing matches', () => {
    montar();
    fireEvent.change(screen.getByTestId('inventario-buscar'), { target: { value: 'maiz' } });
    expect(screen.getByText('Tortilla de maíz')).toBeInTheDocument();
    expect(screen.queryByText('Carne de pastor')).not.toBeInTheDocument();
    fireEvent.change(screen.getByTestId('inventario-buscar'), { target: { value: 'zzz' } });
    expect(screen.getByText('Ningún producto coincide con «zzz».')).toBeInTheDocument();
  });
});

describe('InventarioScreen · movimientos', () => {
  function aMovimientos(): void {
    fireEvent.click(screen.getByTestId('inventario-tabs-movimientos'));
  }

  it('names the tab as the board does, and keeps «de mi turno» on the panel', () => {
    montar();
    const tab = screen.getByTestId('inventario-tabs-movimientos');
    expect(tab).toHaveTextContent(/^Movimientos\d+$/);
    aMovimientos();
    expect(screen.getByText('Movimientos de mi turno')).toBeInTheDocument();
  });

  it('can open straight on the movements tab, as the route or a story hands it', () => {
    montar({ tabInicial: 'movimientos' });
    expect(textoDe('inventario-mov-delta-m-1')).toBe('+15 kg');
  });

  it('says each movement: the product, the note, the kind, the amount, the time', () => {
    montar();
    aMovimientos();
    const panel = screen.getByTestId('inventario-movimientos');
    expect(screen.getByText('Carnicería La Central · nota de remisión')).toBeInTheDocument();
    expect(textoDe('inventario-mov-delta-m-1')).toBe('+15 kg');
    expect(textoDe('inventario-mov-delta-m-3')).toBe('−2 litros');
    expect(textoDe('inventario-mov-hora-m-1')).toBe('08:40');
    expect(screen.getAllByText('Entrada').length).toBe(3);
    expect(within(panel).getAllByText('Merma').length).toBe(2);
  });

  it('says its empty answer when the turno has no movements', () => {
    montar({ data: { ...DATA, movimientos: [] } });
    aMovimientos();
    expect(
      screen.getByText('Todavía no registras entradas ni mermas en este turno.'),
    ).toBeInTheDocument();
  });
});

describe('InventarioScreen · estados del tablero', () => {
  it('sin productos: Don, one sentence and «Producto nuevo»', () => {
    const { onNuevoProducto } = montar({ data: { ...DATA, existencias: [], movimientos: [] } });
    expect(screen.getByText('Todavía no hay productos')).toBeInTheDocument();
    expect(
      screen.getByText('Da de alta lo que vendes y aquí verás cuánto te queda.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('inventario-tabs-movimientos')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('inventario-sin-productos-cta'));
    expect(onNuevoProducto).toHaveBeenCalled();
  });

  it('cargando: the spinner while the read lands', () => {
    montar({ state: 'loading', data: null });
    expect(screen.getByTestId('inventario-cargando')).toBeInTheDocument();
  });

  it('error al leer: says so and retries', () => {
    const onRetry = vi.fn();
    montar({ state: 'error', data: null, onRetry });
    expect(screen.getByText('No pudimos cargar el inventario')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Intentar otra vez'));
    expect(onRetry).toHaveBeenCalled();
  });
});

describe('InventarioScreen · las hojas y el toast', () => {
  it('one tap on a low row opens the sheet on «Llegó mercancía»', () => {
    montar();
    fireEvent.click(screen.getByTestId('inventario-fila-pastor'));
    expect(screen.getByTestId('mover-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('mover-tipo-Entrada').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Hay 8 kg · aviso en 15 kg')).toBeInTheDocument();
  });

  it('one tap on a row with enough opens it on the merma', () => {
    montar();
    fireEvent.click(screen.getByTestId('inventario-fila-horchata'));
    expect(screen.getByTestId('mover-tipo-Merma').getAttribute('aria-checked')).toBe('true');
  });

  it('has no entries without a product: every move starts on its row', () => {
    montar();
    expect(screen.queryByTestId('inventario-abrir-entrada')).not.toBeInTheDocument();
    expect(screen.queryByTestId('inventario-abrir-merma')).not.toBeInTheDocument();
  });

  it('reponer (Inicio Para hoy) opens the llegada sheet on that product', () => {
    montar({ reponer: 'horchata' });
    expect(screen.getByTestId('mover-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('mover-tipo-Entrada').getAttribute('aria-checked')).toBe('true');
    expect(screen.getByText('Hay 9 litros · aviso en 6 litros')).toBeInTheDocument();
  });

  it('a recorded merma closes the sheet and leaves the toast with its motivo', async () => {
    const { registrar } = montar();
    fireEvent.click(screen.getByTestId('inventario-fila-pastor'));
    fireEvent.click(screen.getByTestId('mover-tipo-Merma'));
    fireEvent.change(screen.getByTestId('mover-cantidad'), { target: { value: '3' } });
    fireEvent.click(screen.getByTestId('mover-motivo-Se rompió'));
    fireEvent.click(screen.getByTestId('mover-guardar'));
    await waitFor(() => expect(registrar).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByTestId('mover-sheet')).not.toBeInTheDocument());
    expect(textoDe('mov-toast')).toContain('Merma registrada');
    expect(textoDe('mov-toast')).toContain('−3 de Carne de pastor · Se rompió. Queda en tu turno.');
    fireEvent.click(screen.getByTestId('mov-toast-entendido'));
    expect(screen.queryByTestId('mov-toast')).not.toBeInTheDocument();
  });
});
