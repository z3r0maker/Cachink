import { describe, expect, it, vi } from 'vitest';
import type { Product } from '@xangarro/domain';

import { ProductoNuevoSheet } from '../../src/screens/Ventas/producto-nuevo-sheet';
import { fireEvent, renderWithProviders, screen, waitFor } from '../test-utils';

/**
 * «Producto nuevo en caja»: two questions (three when the catalogue uses
 * both kinds), a live tile preview, and an add button that waits for the
 * name and the price before promising anything. A scan hands in its code; a
 * failed save says so in place; a saved product goes straight to the ticket.
 */

const PRODUCTO = { id: 'p-9' } as unknown as Product;

function montar(over: Record<string, unknown> = {}) {
  const onGuardar = vi.fn(async () => PRODUCTO);
  const onListo = vi.fn();
  const onClose = vi.fn();
  renderWithProviders(
    <ProductoNuevoSheet
      open={true}
      onClose={onClose}
      codigo={null}
      tipos={['Producto Terminado']}
      dueno="Pedro"
      onGuardar={onGuardar as never}
      onListo={onListo}
      {...over}
    />,
  );
  return { onGuardar, onListo, onClose };
}

function escribir(testID: string, texto: string): void {
  fireEvent.change(screen.getByTestId(testID), { target: { value: texto } });
}

describe('ProductoNuevoSheet', () => {
  it('waits for the name and the price; both together open the door', () => {
    montar();
    expect(screen.getByTestId('producto-nuevo-agregar').textContent).toContain(
      'Escribe el nombre y el precio',
    );
    escribir('producto-nuevo-nombre', 'Agua de jamaica');
    escribir('producto-nuevo-precio', '25');
    expect(screen.getByTestId('producto-nuevo-agregar').textContent).toContain(
      'Agregar y ponerlo en el ticket',
    );
  });

  it('a scan hands in its code; two catalogue kinds ask the third question', () => {
    montar({ codigo: '7501234567890', tipos: ['Producto Terminado', 'Materia Prima'] });
    expect(screen.getByTestId('producto-nuevo-codigo')).toBeInTheDocument();
    expect(screen.getByText('¿De qué tipo es?')).toBeInTheDocument();
    expect(screen.getByText('3 preguntas y a vender')).toBeInTheDocument();
  });

  it('one catalogue kind: two questions only', () => {
    montar();
    expect(screen.queryByText('¿De qué tipo es?')).not.toBeInTheDocument();
    expect(screen.getByText('2 preguntas y a vender')).toBeInTheDocument();
  });

  it('adding saves and hands the product to the ticket', async () => {
    const { onGuardar, onListo } = montar();
    escribir('producto-nuevo-nombre', 'Agua de jamaica');
    escribir('producto-nuevo-precio', '25');
    fireEvent.click(screen.getByTestId('producto-nuevo-agregar'));
    await waitFor(() => expect(onListo).toHaveBeenCalledWith(PRODUCTO));
    expect(onGuardar).toHaveBeenCalledTimes(1);
  });

  it('a failed save says so in place, and the sheet stays', async () => {
    const onListo = vi.fn();
    renderWithProviders(
      <ProductoNuevoSheet
        open={true}
        onClose={vi.fn()}
        codigo={null}
        tipos={['Producto Terminado']}
        dueno="Pedro"
        onGuardar={
          vi.fn(async () => {
            throw new Error('db');
          }) as never
        }
        onListo={onListo}
      />,
    );
    escribir('producto-nuevo-nombre', 'Agua');
    escribir('producto-nuevo-precio', '25');
    fireEvent.click(screen.getByTestId('producto-nuevo-agregar'));
    await waitFor(() => expect(screen.getByText(/No se pudo guardar/)).toBeInTheDocument());
    expect(onListo).not.toHaveBeenCalled();
  });

  it('closed renders nothing', () => {
    montar({ open: false });
    expect(screen.queryByTestId('producto-nuevo-sheet')).not.toBeInTheDocument();
  });
});
