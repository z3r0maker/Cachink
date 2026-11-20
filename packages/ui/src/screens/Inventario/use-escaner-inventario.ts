/**
 * What Inventario's escáner needs from the catalogue (M-20): every product,
 * supplies included (Cobrar's list leaves them out, but they arrive by the
 * box too), read the way Cobrar reads them (`productosDeCaja`), the types
 * Producto nuevo asks about, and its save.
 */
import { useMemo } from 'react';
import type { InventoryCategory } from '@xangarro/domain';
import { useCrearProducto } from '../../hooks/use-crear-producto';
import { useProductos } from '../../hooks/use-productos';
import { useProductosConStock } from '../../hooks/use-productos-con-stock';
import { useStockMap } from '../../hooks/use-stock-map';
import { productosDeCaja } from '../Ventas/cobrar-catalogo';
import type { InventarioEscanerProps } from './inventario-escaner';

/** `onCreado`: the route reads Inventario again, so a new product is listed. */
export function useEscanerInventario(onCreado: () => void): InventarioEscanerProps {
  const productosQ = useProductos();
  const stockMap = useStockMap(useProductosConStock());
  const crear = useCrearProducto();
  const productos = useMemo(
    () => productosDeCaja(productosQ.data ?? [], stockMap),
    [productosQ.data, stockMap],
  );
  const tipos = useMemo(
    () => [...new Set((productosQ.data ?? []).map((p) => p.categoria))] as InventoryCategory[],
    [productosQ.data],
  );
  return { productos, tipos, onGuardar: crear.mutateAsync, onCreado };
}
