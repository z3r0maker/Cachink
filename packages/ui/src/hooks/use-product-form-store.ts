/**
 * Product form zustand store — persists form state in memory across
 * navigations (e.g. when the user navigates to the icon picker and
 * comes back to the detail form).
 */

import { create } from 'zustand';
import type {
  InventoryCategory,
  InventoryUnit,
  ProductColor,
  ProductIcon,
  UsoProducto,
} from '@cachink/domain';

export interface ProductFormDraft {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  usoProducto: UsoProducto;
  costoPesos: string;
  precioVentaPesos: string;
  unidad: InventoryUnit;
  umbral: string;
  colorFondo: ProductColor;
  icono: ProductIcon | null;
  /** The product ID being edited (null = creating new). */
  editingProductId: string | null;
}

interface ProductFormStore {
  draft: ProductFormDraft | null;
  setDraft: (d: ProductFormDraft) => void;
  updateIcon: (icon: ProductIcon) => void;
  clear: () => void;
}

export const useProductFormStore = create<ProductFormStore>((set) => ({
  draft: null,
  setDraft: (d) => set({ draft: d }),
  updateIcon: (icon) =>
    set((s) => (s.draft ? { draft: { ...s.draft, icono: icon } } : s)),
  clear: () => set({ draft: null }),
}));
