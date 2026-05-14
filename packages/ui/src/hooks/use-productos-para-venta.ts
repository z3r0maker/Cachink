/**
 * useProductosParaVenta — filters out materia-prima-only products.
 *
 * Products with usoProducto === 'materia-prima' should not appear in
 * the POS grid since they cannot be sold directly. Products with
 * 'venta' or 'ambos' pass through.
 *
 * Phase 18: Conversion feature.
 */

import { useMemo } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Product } from '@cachink/domain';
import { useProductos } from './use-productos';

export function useProductosParaVenta(): UseQueryResult<readonly Product[], Error> {
  const productosQ = useProductos();
  const filtered = useMemo(
    () =>
      (productosQ.data ?? []).filter(
        (p: Product) => p.usoProducto !== 'materia-prima',
      ),
    [productosQ.data],
  );
  return { ...productosQ, data: filtered } as UseQueryResult<readonly Product[], Error>;
}
