'use client';

import { colors } from '@xangarro/tokens';

import { anim, ceja, escena5s, fila, sinMovimiento, volante } from './animation.css';

/** Scene 3 · a ticket prints while the month's statement folds open (P-02). */

const LINEAS = [
  { width: '100%', clase: anim.lineaImprime300 },
  { width: '78%', clase: anim.lineaImprime620 },
  { width: '92%', clase: anim.lineaImprime940 },
] as const;

const RENGLONES = [
  { label: 'Ingresos', value: '$68,420.00', color: colors.greenText },
  { label: 'Egresos', value: '$53,222.38', color: colors.redText },
  { label: 'Utilidad', value: '$15,197.62', color: colors.black },
] as const;

const ESCENA = { display: 'flex', alignItems: 'center', gap: 30 } as const;
const MUESCA = { height: 2, background: colors.gray200, margin: '8px 0' } as const;
const LINEA = {
  height: 8,
  borderRadius: 4,
  background: colors.gray200,
  transformOrigin: 'left center',
} as const;
const TARJETA = {
  border: `2.5px solid ${colors.black}`,
  borderRadius: 16,
  background: colors.white,
  boxShadow: `5px 5px 0 ${colors.black}`,
  padding: 18,
} as const;
const MES = {
  fontSize: 19,
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: colors.black,
  marginTop: 4,
} as const;
const ETIQUETA = { fontSize: 12, fontWeight: 700, color: colors.black } as const;
const CIFRA = {
  fontSize: 13,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
} as const;

export function EscenaEstados() {
  return (
    <div className={`${escena5s} ${sinMovimiento}`} style={ESCENA}>
      <Ticket />
      <EstadoDoblado />
    </div>
  );
}

function Ticket() {
  return (
    <div style={{ flex: 'none', width: 158, height: 156, overflow: 'hidden' }}>
      <div className={`${volante} ${anim.ticketBaja} ${sinMovimiento}`}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: colors.black,
            textAlign: 'center',
          }}
        >
          Taquería Don Pedro
        </div>
        <div style={MUESCA} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {LINEAS.map((l) => (
            <span
              key={l.width}
              className={`${l.clase} ${sinMovimiento}`}
              style={{ ...LINEA, width: l.width }}
            />
          ))}
        </div>
        <div style={{ ...MUESCA, margin: '10px 0 8px' }} />
        <TotalTicket />
      </div>
    </div>
  );
}

function TotalTicket() {
  return (
    <div
      style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}
    >
      <span className={ceja}>Total</span>
      <span
        style={{
          fontSize: 15,
          fontWeight: 800,
          fontVariantNumeric: 'tabular-nums',
          color: colors.black,
        }}
      >
        $310.00
      </span>
    </div>
  );
}

function EstadoDoblado() {
  return (
    <div className={`${anim.dobla} ${sinMovimiento}`} style={{ flex: 1, minWidth: 0 }}>
      <div style={TARJETA}>
        <div className={ceja}>Estado de resultados</div>
        <div style={MES}>Mayo 2026</div>
        <div style={{ marginTop: 12 }}>
          {RENGLONES.map((r) => (
            <div key={r.label} className={fila} style={{ padding: '8px 0' }}>
              <span style={ETIQUETA}>{r.label}</span>
              <span style={{ ...CIFRA, color: r.color }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
