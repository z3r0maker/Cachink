/**
 * «Producto nuevo en caja» (MvProductoNuevo; the web caja's `nuevo.tsx`):
 * three questions (name, price, type) and a look at the tile it makes. It
 * needs a name and a price; it saves through the phone's quick-add path
 * (`buildProductoPayload`, `useCrearProducto`) without stock tracking, so it
 * sells at once.
 */
import { useState } from 'react';
import { resolveProductIcon, type InventoryCategory, type ProductIcon } from '@xangarro/domain';
import { parseRecibido } from '@xangarro/caja/caja';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { buildProductoPayload } from '../Productos/nuevo-producto-form';

/** The choices under «Cambiar ícono», with the word the screen reader says. */
export const ICONOS_NUEVO: readonly (readonly [ProductIcon, string])[] = [
  ['beef', 'Carne'],
  ['drumstick', 'Pollo'],
  ['sandwich', 'Antojito'],
  ['pizza', 'Pizza'],
  ['soup', 'Caldo'],
  ['salad', 'Ensalada'],
  ['cup-soda', 'Refresco'],
  ['glass-water', 'Agua'],
  ['coffee', 'Café'],
  ['beer', 'Cerveza'],
  ['croissant', 'Pan'],
  ['package', 'Otro'],
];

export function useProductoNuevo(codigo: string | null, tipos: readonly InventoryCategory[]) {
  const [nombre, setNombreRaw] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipo, setTipo] = useState<InventoryCategory>(tipos[0] ?? 'Producto Terminado');
  const [elegido, setElegido] = useState<ProductIcon | null>(null);
  const [cambiar, setCambiar] = useState(false);
  const monto = parseRecibido(precio);
  const ok = nombre.trim() !== '' && monto !== null && monto > 0n;
  const icono = elegido ?? resolveProductIcon(null, tipo);
  const payload = (): CrearProductoInput => ({
    ...buildProductoPayload({
      nombre,
      sku: codigo ?? '',
      categoria: tipo,
      precioVentaPesos: precio,
      stock: 'sin-stock',
    }),
    icono,
  });
  return {
    nombre,
    setNombre: (v: string) => setNombreRaw(v),
    precio,
    setPrecio: (v: string) => setPrecio(v.replace(/[^0-9.]/g, '')),
    tipo,
    setTipo,
    icono,
    elegido,
    setElegido,
    cambiar,
    setCambiar,
    monto,
    ok,
    payload,
  };
}

export type ProductoNuevoForm = ReturnType<typeof useProductoNuevo>;
