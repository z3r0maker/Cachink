/**
 * Inventario (M-09, MvInventario) as the operator meets it: the figures, the
 * search, «Movimientos · N», and a product's sheet recording a merma.
 * Presentational: the screen is fed the design's inventory.
 */
import { describe, expect, it, vi } from 'vitest';
import { initI18n } from '../../../src/i18n/index';
import { InventarioScreen } from '../../../src/screens/Inventario/inventario-screen';
import { muestraInventario } from '../../../src/screens/Inventario/inventario-muestra';
import { fireEvent, renderWithProviders, screen, waitFor } from '../../test-utils';

initI18n();

function tap(testID: string): void {
  const el = screen.getByTestId(testID);
  fireEvent.pointerDown(el);
  fireEvent.pointerUp(el);
  fireEvent.click(el);
}

function pantalla(onRegistrar = vi.fn(() => Promise.resolve())) {
  renderWithProviders(
    <InventarioScreen
      state="happy"
      data={muestraInventario()}
      dueno="Pedro"
      registrando={false}
      onRegistrar={onRegistrar}
      onRetry={vi.fn()}
    />,
  );
  return onRegistrar;
}

describe('Inventario', () => {
  it('counts what to restock and what moved, and lists the stock', () => {
    pantalla();
    expect(screen.getByTestId('inventario-reponer')).toHaveTextContent('4');
    expect(screen.getByTestId('inventario-entradas')).toHaveTextContent('3');
    expect(screen.getByTestId('inventario-mermas')).toHaveTextContent('2');
    expect(screen.getByTestId('inventario-fila-pastor')).toHaveTextContent('Reponer');
    expect(screen.getByTestId('inventario-fila-tortilla')).toHaveTextContent('Suficiente');
  });

  it('searches, and says so when nothing matches', () => {
    pantalla();
    fireEvent.change(screen.getByTestId('inventario-buscar'), { target: { value: 'zzz' } });
    expect(screen.getByTestId('inventario-sin-resultados')).toHaveTextContent(
      'No hay productos con «zzz».',
    );
  });

  it('shows the turno’s movements, newest first', () => {
    pantalla();
    tap('inventario-tabs-movimientos');
    const filas = screen.getAllByTestId(/^inventario-mov-/);
    expect(filas[0]).toHaveTextContent('Agua embotellada');
    expect(filas[0]).toHaveTextContent('+24 piezas');
  });

  it('records a merma with what happened, then says it', async () => {
    const onRegistrar = pantalla();
    tap('inventario-fila-tortilla');
    expect(screen.getByTestId('mover-sheet')).toBeInTheDocument();
    expect(screen.getByTestId('mover-registrar')).toBeDisabled();
    tap('mover-motivo-Se rompió');
    tap('mover-mas');
    expect(screen.getByTestId('mover-quedan')).toHaveTextContent('Te van a quedar 218 piezas');
    tap('mover-registrar');
    await waitFor(() => expect(onRegistrar).toHaveBeenCalled());
    const [b, e] = onRegistrar.mock.calls[0] as unknown as [
      { tipo: string; cantidad: number; motivo: string },
      { id: string },
    ];
    expect(b).toMatchObject({ tipo: 'Merma', cantidad: 2, motivo: 'Se rompió' });
    expect(e.id).toBe('tortilla');
    await waitFor(() => expect(screen.getByTestId('inventario-toast')).toBeInTheDocument());
  });

  it('opens a product a link asked for on «Llegó mercancía»', () => {
    renderWithProviders(
      <InventarioScreen
        state="happy"
        data={muestraInventario()}
        dueno="Pedro"
        registrando={false}
        onRegistrar={vi.fn()}
        onRetry={vi.fn()}
        abrir={{ id: 'tortilla', tipo: 'Entrada' }}
      />,
    );
    expect(screen.getByTestId('mover-tipo-Entrada')).toHaveAttribute('aria-checked', 'true');
  });

  it('says why it is empty, and retries a failed read', () => {
    const onRetry = vi.fn();
    const { unmount } = renderWithProviders(
      <InventarioScreen
        state="error"
        data={muestraInventario()}
        dueno="Pedro"
        registrando={false}
        onRegistrar={vi.fn()}
        onRetry={onRetry}
      />,
    );
    tap('inventario-error-reintentar');
    expect(onRetry).toHaveBeenCalled();
    unmount();
    renderWithProviders(
      <InventarioScreen
        state="empty"
        data={{ existencias: [], movimientos: [] }}
        dueno="Pedro"
        registrando={false}
        onRegistrar={vi.fn()}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByTestId('inventario-vacio')).toHaveTextContent(
      'Sin productos con existencias',
    );
  });
});
