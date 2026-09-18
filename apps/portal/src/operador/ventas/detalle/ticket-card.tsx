import { formatMoney, type Money } from '@xangarro/domain';
import { colors, portalFontSizes } from '@xangarro/tokens';

import { TINT } from '../../caja/categorias';
import { importe } from '../../caja/ticket';
import * as u from '../../ui/ui.css';
import * as d from './detalle.css';
import type { VentaDetalle } from './types';

/** Green when registered, amber when fiado, gray and struck through once cancelled. */
function headBg(v: VentaDetalle, cancelada: string | null): string {
  if (cancelada) return colors.gray100;
  return v.fiado ? colors.warningSoft : colors.greenSoft;
}

/** The whole ticket: total and method, the lines, then subtotal, cash and change. */
export function TicketCard(p: {
  readonly venta: VentaDetalle;
  readonly total: Money;
  readonly cancelada: string | null;
}) {
  const { venta: v, total } = p;
  return (
    <div className={u.listCard}>
      <Cabeza venta={v} total={total} cancelada={p.cancelada} />
      <div style={{ padding: '8px 0' }}>
        {v.lineas.map((l) => (
          <div key={l.productoId} className={d.line}>
            <span className={d.qty} style={{ background: TINT[l.categoria] }}>
              {l.cantidad}×
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={d.lineName}>{l.nombre}</div>
              <div className={d.lineEach}>{formatMoney(l.precio)} cada uno</div>
            </div>
            <span className={d.figure}>{formatMoney(importe(l))}</span>
          </div>
        ))}
      </div>
      <Resumen venta={v} total={total} />
    </div>
  );
}

function Cabeza(p: {
  readonly venta: VentaDetalle;
  readonly total: Money;
  readonly cancelada: string | null;
}) {
  const { venta: v, total } = p;
  return (
    <div className={d.head} style={{ background: headBg(v, p.cancelada) }}>
      <div style={{ flex: 1, minWidth: 180 }}>
        <div className={u.eyebrow}>Venta {v.folio}</div>
        <div className={d.total} style={{ textDecoration: p.cancelada ? 'line-through' : 'none' }}>
          {formatMoney(total)}
        </div>
        <div className={d.when}>
          {v.cuando} · {v.metodo}
        </div>
      </div>
      {p.cancelada ? (
        <div className={d.cancelBox}>
          <div className={d.cancelLabel}>Cancelada</div>
          <div className={d.cancelMotivo}>{p.cancelada}</div>
        </div>
      ) : null}
    </div>
  );
}

function Resumen({ venta, total }: { readonly venta: VentaDetalle; readonly total: Money }) {
  const rows: [string, Money][] = [['Subtotal', total]];
  if (venta.recibido !== undefined) {
    rows.push(['Recibido en efectivo', venta.recibido]);
    rows.push(['Cambio que se entregó', venta.recibido - total]);
  }
  return (
    <div className={d.resumen}>
      {rows.map(([label, value]) => (
        <div key={label} className={d.resumenRow}>
          <span className={d.resumenLabel}>{label}</span>
          <span className={d.figure} style={{ marginLeft: 'auto' }}>
            {formatMoney(value)}
          </span>
        </div>
      ))}
      <div className={d.resumenRow}>
        <span className={d.resumenLabel} data-total="">
          Total
        </span>
        <span className={d.figure} style={{ marginLeft: 'auto', fontSize: portalFontSizes.xl4 }}>
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}
