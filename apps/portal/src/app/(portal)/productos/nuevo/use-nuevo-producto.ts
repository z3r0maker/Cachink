'use client';

import type {
  InventoryCategory,
  InventoryUnit,
  ProductColor,
  ProductIcon,
  ProductoTipo,
  UsoProducto,
} from '@xangarro/domain';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { pesosToCentavos } from '@/lib/money';
import { crearProducto } from '@/server/actions/crear-producto';

/**
 * «Nuevo producto» form state (P-07). Money stays text until submit and is
 * parsed once, by `pesosToCentavos`; the product starts at zero stock
 * (ADR-081), so there is no stock field at all.
 */
export interface Draft {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  tipo: ProductoTipo;
  usoProducto: UsoProducto;
  costo: string;
  precio: string;
  unidad: InventoryUnit;
  seguirStock: boolean;
  umbral: string;
  colorFondo: ProductColor;
  icono: ProductIcon | null;
}

export const EMPTY: Draft = {
  nombre: '',
  sku: '',
  categoria: 'Producto Terminado',
  tipo: 'producto',
  usoProducto: 'venta',
  costo: '',
  precio: '',
  unidad: 'pza',
  seguirStock: true,
  umbral: '3',
  colorFondo: 'white',
  icono: null,
};

function validate(d: Draft) {
  const costoUnitCentavos = pesosToCentavos(d.costo);
  const precioVentaCentavos = pesosToCentavos(d.precio);
  const umbral = Number(d.umbral);
  if (d.nombre.trim().length === 0) return 'Escribe el nombre del producto.';
  if (costoUnitCentavos === null) return 'Escribe el costo, por ejemplo 12.50';
  if (precioVentaCentavos === null) return 'Escribe el precio de venta, por ejemplo 25.00';
  if (!Number.isInteger(umbral) || umbral < 0) return 'El aviso de stock bajo es un número entero.';
  return { costoUnitCentavos, precioVentaCentavos, umbralStockBajo: umbral };
}

export function useNuevoProducto(onDone: () => void) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const set = (patch: Partial<Draft>): void => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  function save(): void {
    const ok = validate(draft);
    if (typeof ok === 'string') return setError(ok);
    const { costo: _c, precio: _p, umbral: _u, sku, nombre, ...rest } = draft;
    startTransition(async () => {
      const result = await crearProducto({
        ...rest,
        ...ok,
        nombre: nombre.trim(),
        sku: sku.trim() || undefined,
      });
      if (!result.ok) return setError(result.message);
      setDraft(EMPTY);
      onDone();
      router.refresh();
    });
  }
  return { draft, set, error, pending, save };
}
