import Link from 'next/link';
import { colors } from '@xangarro/tokens';
import { formatMoney, type Money } from '@xangarro/domain';

import { OPERADOR_BASE } from '../shell/nav';
import { Panel, Tile } from '../ui/panel';
import * as p from '../ui/panel.css';
import * as r from './rows.css';
import type { Movimiento, MovimientoTipo } from './types';

const KIND: Record<MovimientoTipo, { tint: string; icon: string }> = {
  venta: {
    tint: colors.greenSoft,
    icon: 'M3 6h2l2.4 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 9H6',
  },
  gasto: { tint: colors.redSoft, icon: 'M12 3v14M6 11l6 6 6-6M4 21h16' },
  credito: {
    tint: colors.warningSoft,
    icon: 'M16 20v-2a4 4 0 0 0-8 0v2M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  },
  abono: { tint: colors.blueSoft, icon: 'M12 19V5M5 12l7-7 7 7' },
  merma: { tint: colors.peachSoft, icon: 'M12 5v14M5 12l7 7 7-7' },
};

/** «Sin monto» for movements that move no money; negatives in red with a true minus. */
function amount(m: Money): { text: string; color: string } {
  if (m === 0n) return { text: 'Sin monto', color: colors.textMuted };
  if (m < 0n) return { text: `−${formatMoney(-m)}`, color: colors.redText };
  return { text: formatMoney(m), color: colors.black };
}

export function Movimientos({ items }: { readonly items: readonly Movimiento[] }) {
  const link = (
    <Link href={`${OPERADOR_BASE}/ventas`} className={p.headLink}>
      Ver ventas
    </Link>
  );
  return (
    <Panel label="Movimientos de tu turno" action={link}>
      {items.map((m) => {
        const k = KIND[m.tipo];
        const a = amount(m.monto);
        return (
          <div key={m.id} className={r.row}>
            <Tile icon={k.icon} tint={k.tint} />
            <span className={r.main}>
              <span className={p.rowTitle}>{m.titulo}</span>
              <span className={p.rowDetail}>{m.detalle}</span>
            </span>
            <span className={r.hora}>{m.hora}</span>
            <span className={r.monto} style={{ color: a.color, marginLeft: 0 }}>
              {a.text}
            </span>
          </div>
        );
      })}
    </Panel>
  );
}
