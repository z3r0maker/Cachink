'use client';

import type { ReactElement } from 'react';
import { colors } from '@xangarro/tokens';

import {
  anim,
  barra as claseBarra,
  ceja,
  columnaBarras,
  escena55s,
  leyendaCuadro,
  sinMovimiento,
} from './animation.css';

/** Scene 4 · bars grow, the «Utilidad de hoy» badge pops with its counter (P-02). */

const BARRAS = [
  { ventas: '58%', gastos: '34%', d1: anim.barraCree260, d2: anim.barraCree360 },
  { ventas: '74%', gastos: '42%', d1: anim.barraCree460, d2: anim.barraCree560 },
  { ventas: '46%', gastos: '30%', d1: anim.barraCree660, d2: anim.barraCree760 },
  { ventas: '88%', gastos: '38%', d1: anim.barraCree860, d2: anim.barraCree960 },
] as const;

const ESCENA = { display: 'flex', alignItems: 'flex-end', gap: 30 } as const;
const GRAFICA = {
  flex: 1,
  minWidth: 0,
  height: 156,
  display: 'flex',
  alignItems: 'flex-end',
  gap: 14,
  borderBottom: `2.5px solid ${colors.black}`,
} as const;
const INSIGNIA = {
  border: `2.5px solid ${colors.black}`,
  borderRadius: 16,
  background: colors.white,
  boxShadow: `5px 5px 0 ${colors.black}`,
  padding: 18,
} as const;
const CIFRA = {
  fontSize: 28,
  fontWeight: 800,
  letterSpacing: '-0.035em',
  fontVariantNumeric: 'tabular-nums',
  color: colors.black,
  marginTop: 6,
} as const;
const LEYENDA = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  fontWeight: 700,
  color: colors.black,
} as const;

export function EscenaUtilidad({ utilidad }: { readonly utilidad: ReactElement }) {
  return (
    <div className={`${escena55s} ${sinMovimiento}`} style={ESCENA}>
      <Grafica />
      <div className={`${anim.insigniaPop} ${sinMovimiento}`} style={{ flex: 'none', width: 168 }}>
        <div style={INSIGNIA}>
          <div className={ceja}>Utilidad de hoy</div>
          <div style={CIFRA}>{utilidad}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 14 }}>
            <span style={LEYENDA}>
              <span className={leyendaCuadro} style={{ background: colors.green }} />
              Ventas
            </span>
            <span style={LEYENDA}>
              <span className={leyendaCuadro} style={{ background: colors.red }} />
              Gastos
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The four ventas/gastos column pairs, growing on their staggered delays. */
function Grafica() {
  return (
    <div style={GRAFICA}>
      {BARRAS.map((b) => (
        <div key={b.ventas} className={columnaBarras}>
          <span
            className={`${claseBarra} ${b.d1} ${sinMovimiento}`}
            style={{ height: b.ventas, background: colors.green }}
          />
          <span
            className={`${claseBarra} ${b.d2} ${sinMovimiento}`}
            style={{ height: b.gastos, background: colors.red }}
          />
        </div>
      ))}
    </div>
  );
}
