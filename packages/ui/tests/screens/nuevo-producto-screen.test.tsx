/**
 * NuevoProductoScreen — quick-add (A-09): only the fields an operator knows
 * at the counter; costo, unidad, umbral and ícono default and live in the portal.
 */

import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '../test-utils';
import { initI18n } from '../../src/i18n/index';
import { NuevoProductoScreen } from '../../src/screens/Productos/nuevo-producto-screen';
import {
  buildProductoPayload,
  initialProductoState,
} from '../../src/screens/Productos/nuevo-producto-form';

initI18n();

describe('NuevoProductoScreen (quick-add)', () => {
  it('asks only nombre, código, categoría, precio and stock tracking', () => {
    renderWithProviders(<NuevoProductoScreen onSubmit={vi.fn()} onBack={vi.fn()} />);
    for (const id of [
      'producto-nombre',
      'producto-sku',
      'producto-scan',
      'producto-categoria',
      'producto-precio-venta',
      'producto-stock-tracking',
      'producto-submit',
    ]) {
      expect(screen.getByTestId(id)).toBeTruthy();
    }
    for (const id of ['producto-costo', 'producto-unidad', 'producto-umbral', 'producto-uso']) {
      expect(screen.queryByTestId(id)).toBeNull();
    }
  });

  it('moves from código to precio on Return (the keyboard covers precio on phones)', () => {
    renderWithProviders(<NuevoProductoScreen onSubmit={vi.fn()} onBack={vi.fn()} />);
    const input = (id: string): HTMLInputElement => {
      const el = screen.getByTestId(id);
      return (el.tagName === 'INPUT' ? el : el.querySelector('input'))! as HTMLInputElement;
    };
    input('producto-sku').focus();
    fireEvent.keyDown(input('producto-sku'), { key: 'Enter', code: 'Enter', keyCode: 13 });
    expect(document.activeElement).toBe(input('producto-precio-venta'));
  });

  it('does not submit without nombre and a positive price', () => {
    const onSubmit = vi.fn();
    renderWithProviders(<NuevoProductoScreen onSubmit={onSubmit} onBack={vi.fn()} />);
    fireEvent.click(screen.getByTestId('producto-submit'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('buildProductoPayload', () => {
  it('fills the portal-owned fields with defaults', () => {
    const payload = buildProductoPayload({
      ...initialProductoState(),
      nombre: ' Taco ',
      precioVentaPesos: '25.50',
      stock: 'sin-stock',
    });
    expect(payload).toMatchObject({
      nombre: 'Taco',
      precioVenta: 2550n,
      costoUnit: 0n,
      unidad: 'pza',
      umbralStockBajo: 3,
      usoProducto: 'venta',
      seguirStock: false,
    });
    expect(payload.sku).toBeUndefined();
  });
});
