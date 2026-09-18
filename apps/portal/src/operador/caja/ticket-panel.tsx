'use client';

import { formatMoney } from '@xangarro/domain';

import { Icon } from '../../shell/icon';
import { ICONS } from '../shell/nav';
import * as u from '../ui/ui.css';
import * as f from './ticket-foot.css';
import * as t from './ticket.css';
import { importe } from './ticket';
import type { LineaTicket } from './types';
import type { Caja } from './use-caja';

const MINUS = 'M5 12h14';
const PLUS = 'M12 5v14M5 12h14';
const CLOSE = 'M6 6l12 12M18 6 6 18';

/** The ticket: fixed column when wide, bottom sheet when narrow. */
export function TicketPanel({ caja }: { readonly caja: Caja }) {
  return (
    <aside className={t.panel} data-open={caja.sheetOpen ? '' : undefined} aria-label="Ticket">
      <div className={t.head}>
        <span className={u.eyebrow}>Ticket</span>
        <span className={t.count}>{caja.count}</span>
        <button
          type="button"
          className={t.closeSheet}
          title="Cerrar"
          onClick={() => caja.setSheetOpen(false)}
        >
          <Icon path={CLOSE} size={16} strokeWidth={2.6} />
        </button>
      </div>
      <div className={t.list}>
        {caja.count === 0 ? <TicketVacio /> : null}
        {caja.lines.map((l) => (
          <Linea key={l.productoId} l={l} caja={caja} />
        ))}
      </div>
      <Pie caja={caja} />
    </aside>
  );
}

/** Steppers are 36 px — density the README accepts on desktop only. */
function Linea({ l, caja }: { readonly l: LineaTicket; readonly caja: Caja }) {
  return (
    <div className={t.line}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={t.lineName}>{l.nombre}</div>
        <div className={t.lineEach}>{formatMoney(l.precio)} cada uno</div>
      </div>
      <div className={t.steppers}>
        <button
          type="button"
          className={t.step}
          title="Quitar uno"
          onClick={() => caja.bump(l.productoId, -1)}
        >
          <Icon path={MINUS} size={15} strokeWidth={2.8} />
        </button>
        <span className={t.qty}>{l.cantidad}</span>
        <button
          type="button"
          className={t.step}
          data-plus=""
          title="Agregar uno"
          onClick={() => caja.bump(l.productoId, 1)}
        >
          <Icon path={PLUS} size={15} strokeWidth={2.8} />
        </button>
      </div>
      <div className={t.amount}>{formatMoney(importe(l))}</div>
    </div>
  );
}

/** Total and COBRAR stay anchored at the foot however long the ticket gets. */
function Pie({ caja }: { readonly caja: Caja }) {
  return (
    <div className={t.foot}>
      <div className={t.totalRow}>
        <span className={u.eyebrow}>Total</span>
        <span className={t.totalValue}>{formatMoney(caja.total)}</span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className={f.vaciar} onClick={() => caja.setLines([])}>
          Vaciar
        </button>
        <button
          type="button"
          className={f.cobrar}
          disabled={caja.count === 0}
          onClick={caja.cobrar}
        >
          Cobrar
        </button>
      </div>
    </div>
  );
}

function TicketVacio() {
  return (
    <div className={f.empty}>
      <div className={f.emptyTile}>
        <Icon path={ICONS.ventas} size={26} strokeWidth={2.3} />
      </div>
      <div className={f.emptyTitle}>Ticket vacío</div>
      <div className={f.emptyBody}>Toca los productos del catálogo para armarlo.</div>
    </div>
  );
}

/** Narrow band: the yellow bar that opens the sheet. */
export function TicketBar({ caja }: { readonly caja: Caja }) {
  const show = caja.count > 0 && !caja.sheetOpen;
  return (
    <button
      type="button"
      className={f.bar}
      data-show={show ? '' : undefined}
      data-onyellow=""
      onClick={() => caja.setSheetOpen(true)}
    >
      <span className={f.barCount}>{caja.count}</span>
      <span className={f.barLabel}>Cobrar</span>
      <span className={f.barTotal}>{formatMoney(caja.total)}</span>
    </button>
  );
}
