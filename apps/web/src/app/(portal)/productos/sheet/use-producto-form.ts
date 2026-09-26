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
import { useEffect, useState, useTransition } from 'react';

import { adivinaIcono } from '@/lib/adivina-icono';
import { pesosToCentavos } from '@/lib/money';
import { crearProducto } from '@/server/actions/crear-producto';
import { editarProducto } from '@/server/actions/editar-producto';

import { categoriaDe } from '../nuevo/pasos';
import type { Producto } from '../parts';

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

const pesos = (centavos: bigint): string =>
  `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;

/** A catalogue row as the sheet's draft, for editing. */
export function draftOf(p: Producto): Draft {
  return {
    nombre: p.nombre,
    sku: p.sku,
    categoria: p.categoria as InventoryCategory,
    tipo: p.tipo as ProductoTipo,
    usoProducto: p.usoProducto as UsoProducto,
    costo: pesos(p.costo),
    precio: pesos(p.precio),
    unidad: p.unidad as InventoryUnit,
    seguirStock: p.sigueStock,
    umbral: String(p.umbral),
    colorFondo: p.colorFondo as ProductColor,
    icono: p.icono as ProductIcon | null,
  };
}

type Valid = Exclude<ReturnType<typeof validate>, string>;

/**
 * Create, or edit through `EditarProductoUseCase`: cost and stock tracking are
 * not in the patch (ADR-023; `ProductPatch`), so the sheet shows them read-only.
 */
function submit(d: Draft, ok: Valid, editing: Producto | null) {
  const { costo: _c, precio: _p, umbral: _u, sku, nombre, seguirStock, tipo, ...rest } = d;
  const common = { ...rest, nombre: nombre.trim(), sku: sku.trim() || undefined };
  if (editing === null) {
    // ADR-107: no category list and no empty icon — both follow from the answers.
    const nuevo = { categoria: categoriaDe(d.usoProducto), icono: d.icono ?? adivinaIcono(nombre) };
    return crearProducto({
      ...common,
      ...nuevo,
      ...ok,
      seguirStock: tipo === 'servicio' ? false : seguirStock,
      tipo,
    });
  }
  const { costoUnitCentavos: _cost, ...patch } = ok;
  return editarProducto(editing.id, { ...common, ...patch });
}

export function useProductoForm(editing: Producto | null, onDone: () => void) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  useEffect(() => {
    setDraft(editing === null ? EMPTY : draftOf(editing));
    setError(null);
  }, [editing]);
  const set = (patch: Partial<Draft>): void => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  function save(): void {
    const ok = validate(draft);
    if (typeof ok === 'string') return setError(ok);
    startTransition(async () => {
      const result = await submit(draft, ok, editing);
      if (!result.ok) return setError(result.message);
      setDraft(EMPTY);
      onDone();
      router.refresh();
    });
  }
  return { draft, set, error, pending, save, editing: editing !== null };
}
