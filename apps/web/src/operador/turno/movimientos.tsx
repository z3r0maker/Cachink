import { colors } from '@xangarro/tokens';
import { formatMoney, type Money } from '@xangarro/domain';

import { OPERADOR_BASE } from '../shell/nav';
import { ListCard, TintBox } from '../ui/parts';
import * as u from '../ui/ui.css';
import * as l from './lists.css';
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

/** «—» for movements that move no money; negatives in red with a true minus. */
function amount(m: Money): { text: string; color: string } {
  if (m === 0n) return { text: '—', color: colors.gray400 };
  if (m < 0n) return { text: `−${formatMoney(-m)}`, color: colors.redText };
  return { text: formatMoney(m), color: colors.black };
}

export function Movimientos({ items }: { readonly items: readonly Movimiento[] }) {
  return (
    <ListCard
      label="Movimientos de tu turno"
      headBg={colors.gray100}
      link={{ label: 'Ver ventas', href: `${OPERADOR_BASE}/ventas` }}
    >
      {items.map((m) => {
        const k = KIND[m.tipo];
        const a = amount(m.monto);
        return (
          <div key={m.id} className={u.row} data-hover="" style={{ gap: 14, padding: '13px 18px' }}>
            <TintBox icon={k.icon} tint={k.tint} size={40} glyph={19} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={l.name}>{m.titulo}</div>
              <div className={l.detail}>{m.detalle}</div>
            </div>
            <span className={l.time}>{m.hora}</span>
            <span className={l.amount} style={{ color: a.color }}>
              {a.text}
            </span>
          </div>
        );
      })}
    </ListCard>
  );
}
