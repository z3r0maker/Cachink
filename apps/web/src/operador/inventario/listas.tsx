import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as l from '../turno/lists.css';
import { Glyph } from '../ui/parts';
import { PRODUCT_ICONS } from '../ui/product-icons';
import * as u from '../ui/ui.css';
import * as v from '../ventas/ventas.css';
import { delta, porReponer } from './derive';
import * as s from './inventario.css';
import type { Existencia, Movimiento, TipoMovimiento } from './types';

export const UP = 'M12 19V5M5 12l7-7 7 7';
export const DOWN = 'M12 5v14M5 12l7 7 7-7';

/** Existencias: threshold, unit, «Reponer» / «Suficiente», the count, and the two quick actions. */
export function ListaExistencias(p: {
  readonly items: readonly Existencia[];
  readonly query: string;
  readonly onMover: (tipo: TipoMovimiento, id: string) => void;
}) {
  return (
    <div className={u.listCard}>
      {p.items.map((it) => (
        <div key={it.id} className={v.row}>
          <span className={s.tile} style={{ background: it.tint }}>
            <Glyph paths={PRODUCT_ICONS[it.icono]} size={21} stroke={2.3} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className={l.name}>{it.nombre}</div>
            <div className={l.detail}>
              Umbral {it.umbral} · {it.unidad}
            </div>
          </div>
          <Estado bajo={porReponer(it)} />
          <div className={s.qty}>{it.existencias}</div>
          <div style={{ flex: 'none', display: 'flex', gap: 8 }}>
            <Rapido tipo="Entrada" onClick={() => p.onMover('Entrada', it.id)} />
            <Rapido tipo="Merma" onClick={() => p.onMover('Merma', it.id)} />
          </div>
        </div>
      ))}
      {p.items.length === 0 ? (
        <div className={s.nada}>Ningún producto coincide con «{p.query}».</div>
      ) : null}
    </div>
  );
}

function Estado({ bajo }: { readonly bajo: boolean }) {
  return (
    <span
      className={v.method}
      style={{
        color: bajo ? colors.redText : colors.greenText,
        background: bajo ? colors.redSoft : colors.greenSoft,
      }}
    >
      {bajo ? 'Reponer' : 'Suficiente'}
    </span>
  );
}

function Rapido({
  tipo,
  onClick,
}: {
  readonly tipo: TipoMovimiento;
  readonly onClick: () => void;
}) {
  const entrada = tipo === 'Entrada';
  return (
    <button
      type="button"
      className={v.square}
      style={{ background: entrada ? colors.greenSoft : colors.redSoft }}
      title={entrada ? 'Registrar entrada' : 'Registrar merma'}
      onClick={onClick}
    >
      <Icon path={entrada ? UP : DOWN} size={16} strokeWidth={2.6} />
    </button>
  );
}

/** «Movimientos de mi turno»: entries in green, write-offs in red, oldest first. */
export function ListaMovimientos(p: {
  readonly movs: readonly Movimiento[];
  readonly items: readonly Existencia[];
}) {
  return (
    <div className={u.listCard}>
      {p.movs.map((m) => {
        const it = p.items.find((i) => i.id === m.existenciaId);
        const entrada = m.tipo === 'Entrada';
        const tint = entrada ? colors.greenSoft : colors.redSoft;
        return (
          <div key={m.id} className={v.row}>
            <span className={s.tile} style={{ background: tint }}>
              <Icon path={entrada ? UP : DOWN} size={19} strokeWidth={2.5} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={l.name}>{it?.nombre}</div>
              <div className={l.detail}>{m.detalle}</div>
            </div>
            <span className={v.method} style={{ background: tint }}>
              {m.tipo}
            </span>
            <div className={s.delta} style={{ color: entrada ? colors.greenText : colors.redText }}>
              {delta(m, it?.unidad ?? '')}
            </div>
            <span className={v.time}>{m.hora}</span>
          </div>
        );
      })}
    </div>
  );
}
