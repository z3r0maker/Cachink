/**
 * useProductFormStore tests — Zustand store for product form state.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useProductFormStore } from '../../src/hooks/use-product-form-store';
import type { ProductFormDraft } from '../../src/hooks/use-product-form-store';

const DRAFT: ProductFormDraft = {
  nombre: 'Harina 1kg',
  sku: 'HAR-001',
  categoria: 'Materia Prima',
  usoProducto: 'venta',
  costoPesos: '35.00',
  precioVentaPesos: '45.00',
  unidad: 'kg',
  umbral: '5',
  colorFondo: 'white',
  icono: null,
  editingProductId: null,
};

describe('useProductFormStore', () => {
  beforeEach(() => {
    useProductFormStore.getState().clear();
  });

  it('starts with null draft', () => {
    expect(useProductFormStore.getState().draft).toBeNull();
  });

  it('setDraft stores the form draft', () => {
    useProductFormStore.getState().setDraft(DRAFT);
    expect(useProductFormStore.getState().draft).toEqual(DRAFT);
  });

  it('updateIcon updates icono in existing draft', () => {
    useProductFormStore.getState().setDraft(DRAFT);
    useProductFormStore.getState().updateIcon('bag' as never);
    expect(useProductFormStore.getState().draft?.icono).toBe('bag');
  });

  it('updateIcon is a no-op when draft is null', () => {
    useProductFormStore.getState().updateIcon('bag' as never);
    expect(useProductFormStore.getState().draft).toBeNull();
  });

  it('clear resets draft to null', () => {
    useProductFormStore.getState().setDraft(DRAFT);
    useProductFormStore.getState().clear();
    expect(useProductFormStore.getState().draft).toBeNull();
  });
});
