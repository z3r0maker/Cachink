import type { ProductColor, ProductIcon } from '@xangarro/domain';
import { colors, productTints } from '@xangarro/tokens';

import { ProductGlyph } from '@/components/product-glyph';
import { adivinaIcono } from '@/lib/adivina-icono';

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

/** The tile's ground: the product's own tint (a `productTints` key) when it set one. */
function fondo(p: Producto): string {
  return productTints[p.colorFondo as ProductColor]?.hex ?? colors.yellowSoft;
}

export function ProductoCell({ p }: { readonly p: Producto }) {
  return (
    <span className={productCell}>
      <span className={tile} style={{ background: fondo(p) }} aria-hidden="true">
        {/* The caja's own glyph (ADR-107); a product saved before icons gets one from its name. */}
        <ProductGlyph icon={(p.icono as ProductIcon | null) ?? adivinaIcono(p.nombre)} size={20} />
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
