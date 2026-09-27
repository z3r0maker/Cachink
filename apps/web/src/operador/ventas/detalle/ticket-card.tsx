import { formatMoney } from '@xangarro/domain';

import { iconoPorNombre, TINT } from '@xangarro/caja/caja';
import { Glyph } from '../../ui/parts';
import { PRODUCT_ICONS } from '@xangarro/caja';
import * as m from '../../ui/mostrador.css';
import * as s from './side.css';
import type { LineaDetalle } from '@xangarro/caja/ventas';

/** «Lo que llevó»: each line with its tinted icon, and its price when the ticket has it. */
export function Lineas({ lineas }: { readonly lineas: readonly LineaDetalle[] }) {
  return (
    <section className={s.seccion} aria-labelledby="det-lineas">
      <h3 id="det-lineas" className={`${m.eyebrow} ${s.h3}`}>
        Lo que llevó
      </h3>
      {lineas.map((l) => (
        <div key={l.productoId} className={s.linea}>
          <span className={s.icono} style={{ background: TINT[l.categoria] }}>
            <Glyph paths={PRODUCT_ICONS[iconoPorNombre(l.nombre)]} size={20} stroke={2.2} />
          </span>
          <span className={s.lineaTexto}>
            <span className={s.lineaNombre}>{l.nombre}</span>
            <span className={s.lineaDetalle}>{detalle(l)}</span>
          </span>
          {l.precio === undefined ? null : (
            <span className={s.lineaTotal}>{formatMoney(l.precio * BigInt(l.cantidad))}</span>
          )}
        </div>
      ))}
    </section>
  );
}

function detalle(l: LineaDetalle): string {
  if (l.precio !== undefined) return `${l.cantidad} × ${formatMoney(l.precio)}`;
  return l.cantidad === 1 ? '1 pieza' : `${l.cantidad} piezas`;
}
