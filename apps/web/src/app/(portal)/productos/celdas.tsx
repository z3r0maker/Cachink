import { colors } from '@xangarro/tokens';

import { StatusPill } from '@/components';

import { llenadoStock } from './derive';
import { isLow, type Producto } from './parts';
import {
  productCell,
  sku as skuClass,
  stockBar,
  stockFill,
  stockLabel,
  tile,
} from './productos.css';

/**
 * The Catálogo table's two composed cells (B-4, B-5).
 *
 * Both were flat: the product was its name alone with the SKU in a column of
 * its own, the category was one `soft` pill whatever the category, and
 * existences were a pill where the design draws a 12px bar. The styles for
 * all of it — `productCell`, `tile`, `sku`, `stockBar`, `stockFill`,
 * `stockLabel` — were written and imported nowhere.
 */

/**
 * The design tints the pill by category. Ours are the product **types** the
 * catalogue actually stores, mapped onto the same four grounds the design
 * uses for its own four: a thing you sell, a drink, something you buy to
 * make it, and everything else.
 */
const TONO_CATEGORIA: Record<string, 'soft' | 'info' | 'peach' | 'neutral'> = {
  'Producto Terminado': 'soft',
  Platillo: 'soft',
  Bebida: 'info',
  'Materia Prima': 'peach',
  Insumo: 'neutral',
};

export function CategoriaPill({ categoria }: { readonly categoria: string }) {
  return <StatusPill tone={TONO_CATEGORIA[categoria] ?? 'neutral'}>{categoria}</StatusPill>;
}

/** The tile's ground: the product's own colour when it set one. */
function fondo(p: Producto): string {
  return p.colorFondo !== null && p.colorFondo !== '' ? p.colorFondo : colors.yellowSoft;
}

export function ProductoCell({ p }: { readonly p: Producto }) {
  return (
    <span className={productCell}>
      <span className={tile} style={{ background: fondo(p) }} aria-hidden="true">
        {p.nombre.slice(0, 1).toLocaleUpperCase('es-MX')}
      </span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 800 }}>{p.nombre}</span>
        {p.sku === '' ? null : <span className={skuClass}>{p.sku}</span>}
      </span>
    </span>
  );
}

/** The 12px bar (B-5); `llenadoStock` owns the arithmetic and its reasons. */
export function ExistenciasCell({ p }: { readonly p: Producto }) {
  if (!p.sigueStock) return <>Sin inventario</>;
  const bajo = isLow(p);
  const pct = llenadoStock(p.stock, p.umbral);
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
      <span className={stockBar} role="img" aria-label={`${p.stock} de umbral ${p.umbral}`}>
        <span
          className={stockFill}
          style={{ width: `${pct}%`, background: bajo ? colors.red : colors.green }}
        />
      </span>
      <span className={stockLabel} style={{ color: bajo ? colors.redText : undefined }}>
        {p.stock} · umbral {p.umbral}
      </span>
    </span>
  );
}
