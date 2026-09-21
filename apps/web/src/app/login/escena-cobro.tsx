'use client';

import type { ReactElement } from 'react';
import { colors } from '@xangarro/tokens';

import {
  anim,
  cifraGrande,
  escena35s,
  moneda as claseMoneda,
  pastilla,
  sinMovimiento,
} from './animation.css';

/** Scene 2 · coins drop into «Cobrado hoy», which counts up (P-02). */

const MONEDAS = [
  { left: 14, bottom: 0, size: 70, font: 29, clase: anim.monedaCae },
  { left: 70, bottom: 50, size: 52, font: 22, clase: anim.monedaCae420 },
  { left: 42, bottom: 92, size: 40, font: 17, clase: anim.monedaCae840 },
] as const;

const DESTELLOS = [
  { left: 106, bottom: 30, clase: anim.destello300 },
  { left: 2, bottom: 86, clase: anim.destello620 },
  { left: 120, bottom: 126, clase: anim.destello900 },
] as const;

const ESCENA = { display: 'flex', alignItems: 'center', gap: 30 } as const;
const POZO = { flex: 'none', position: 'relative', width: 170, height: 156 } as const;
const CEJA = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: colors.black,
} as const;
const PUNTO_VERDE = {
  width: 10,
  height: 10,
  flex: 'none',
  borderRadius: 9999,
  border: `2px solid ${colors.black}`,
  background: colors.green,
} as const;

export function EscenaCobro({ cobrado }: { readonly cobrado: ReactElement }) {
  return (
    <div className={`${escena35s} ${sinMovimiento}`} style={ESCENA}>
      <div style={POZO}>
        <Monedas />
        <Destellos />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={CEJA}>Cobrado hoy</div>
        <div className={cifraGrande} style={{ marginTop: 8 }}>
          {cobrado}
        </div>
        <div className={pastilla} style={{ marginTop: 16 }}>
          <span style={PUNTO_VERDE} />
          18 ventas · 3 operadores
        </div>
      </div>
    </div>
  );
}

function Monedas() {
  return (
    <>
      {MONEDAS.map((m) => (
        <span
          key={m.left}
          className={`${claseMoneda} ${m.clase} ${sinMovimiento}`}
          style={{
            left: m.left,
            bottom: m.bottom,
            width: m.size,
            height: m.size,
            fontSize: m.font,
          }}
        >
          $
        </span>
      ))}
    </>
  );
}

function Destellos() {
  return (
    <>
      {DESTELLOS.map((d) => (
        <svg
          key={d.left}
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke={colors.black}
          strokeWidth={2.6}
          strokeLinecap="round"
          className={`${d.clase} ${sinMovimiento}`}
          style={{ position: 'absolute', left: d.left, bottom: d.bottom }}
        >
          <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
        </svg>
      ))}
    </>
  );
}
