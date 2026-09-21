'use client';

import type { ReactElement } from 'react';
import { colors } from '@xangarro/tokens';

import {
  anim,
  ceja,
  cifraMedia,
  escena6s,
  fila,
  sinMovimiento,
  tarjetaChica,
} from './animation.css';

/** Scene 1 · the counter app: a ticket charged, the day's total landing (P-02). */

const ESCENA = { display: 'flex', alignItems: 'center', gap: 26 } as const;
const MONTO = {
  fontSize: 24,
  fontWeight: 800,
  letterSpacing: '-0.03em',
  color: colors.black,
  marginTop: 5,
  fontVariantNumeric: 'tabular-nums',
} as const;
const CONCEPTO = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  marginTop: 10,
  border: `2px solid ${colors.black}`,
  borderRadius: 8,
  padding: '5px 7px',
  background: colors.offwhite,
} as const;
const PUNTO = {
  width: 7,
  height: 7,
  flex: 'none',
  borderRadius: 9999,
  background: colors.black,
} as const;
const CONCEPTO_TXT = {
  fontSize: 10,
  fontWeight: 700,
  color: colors.black,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
} as const;
const COBRAR = {
  marginTop: 'auto',
  height: 34,
  display: 'grid',
  placeItems: 'center',
  border: `2px solid ${colors.black}`,
  borderRadius: 10,
  background: colors.yellow,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
  color: colors.black,
} as const;
const VUELO = {
  position: 'absolute',
  right: 96,
  top: 'calc(50% + 4px)',
  zIndex: 2,
  display: 'inline-flex',
  alignItems: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: 9999,
  padding: '6px 13px',
  background: colors.white,
  boxShadow: `3px 3px 0 ${colors.black}`,
  fontSize: 14,
  fontWeight: 800,
  color: colors.greenText,
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
} as const;
const TARJETA = {
  flex: 1,
  minWidth: 0,
  alignSelf: 'center',
  border: `2.5px solid ${colors.black}`,
  borderRadius: 16,
  background: colors.white,
  boxShadow: `5px 5px 0 ${colors.black}`,
  padding: 14,
} as const;
const IMPORTE = { fontSize: 12, fontWeight: 700, color: colors.black } as const;
const IMPORTE_NUM = {
  fontSize: 12,
  fontWeight: 800,
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
} as const;
const TOTAL_FILA = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  marginTop: 9,
} as const;

/** The charged ticket, flying +$145, landing in the day's list. */
export function EscenaVenta({ total }: { readonly total: ReactElement }) {
  return (
    <div className={`${escena6s} ${sinMovimiento}`} style={ESCENA}>
      <Ticket />
      <div className={`${anim.vuelo} ${sinMovimiento}`} style={VUELO}>
        +$145.00
      </div>
      <TotalDelDia total={total} />
    </div>
  );
}

function Ticket() {
  return (
    <div className={tarjetaChica} style={{ width: 136, height: 156 }}>
      <div
        style={{
          height: 5,
          width: 38,
          borderRadius: 9999,
          background: colors.gray200,
          margin: '0 auto 12px',
        }}
      />
      <div className={ceja}>Nueva venta</div>
      <div style={MONTO}>$145</div>
      <div style={CONCEPTO}>
        <span style={PUNTO} />
        <span style={CONCEPTO_TXT}>Gringa ×2 + Refresco</span>
      </div>
      <div className={`${anim.prensa} ${sinMovimiento}`} style={COBRAR}>
        Cobrar
      </div>
    </div>
  );
}

function TotalDelDia({ total }: { readonly total: ReactElement }) {
  return (
    <div style={TARJETA}>
      <div className={ceja}>Ventas de hoy</div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 9 }}>
        <div className={fila}>
          <span style={IMPORTE}>Taco al pastor ×3</span>
          <span style={IMPORTE_NUM}>$75.00</span>
        </div>
        <div className={fila}>
          <span style={IMPORTE}>Combo familiar</span>
          <span style={IMPORTE_NUM}>$620.00</span>
        </div>
        <div className={`${fila} ${anim.filaAterriza} ${sinMovimiento}`}>
          <span style={IMPORTE}>Gringa ×2 + Refresco</span>
          <span style={{ ...IMPORTE_NUM, color: colors.greenText }}>$145.00</span>
        </div>
      </div>
      <div style={TOTAL_FILA}>
        <span className={ceja}>Total</span>
        <span className={cifraMedia}>{total}</span>
      </div>
    </div>
  );
}
