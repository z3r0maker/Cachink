import { colors } from '@xangarro/tokens';

import { netoTexto, resumen } from './derive';
import * as s from './resumen.css';
import type { Corte, EstadoCorte } from './types';

function Cifra(p: {
  readonly label: string;
  readonly value: string;
  readonly hint: string;
  readonly color?: string;
}) {
  return (
    <div className={s.celda}>
      <span className={s.etiqueta}>{p.label}</span>
      <span className={s.cifra} style={p.color ? { color: p.color } : undefined}>
        {p.value}
      </span>
      <span className={s.pista}>{p.hint}</span>
    </div>
  );
}

/** How many cortes, how many wait for review, the net difference and how many balanced. */
export function Resumen(p: {
  readonly cortes: readonly Corte[];
  readonly estado: (c: Corte) => EstadoCorte;
}) {
  const r = resumen(p.cortes, p.estado);
  const pendientes = r.porAclarar > 0;
  return (
    <section className={s.tira} aria-label="Resumen del mes">
      <Cifra label="Cortes del mes" value={String(r.cortes)} hint={r.equipo} />
      <Cifra
        label="Por aclarar"
        value={String(r.porAclarar)}
        hint={pendientes ? 'Esperan tu revisión' : 'Todo revisado'}
        color={pendientes ? colors.warningText : colors.greenText}
      />
      <Cifra
        label="Diferencia acumulada"
        value={netoTexto(r.neto)}
        hint="Faltantes y sobrantes del mes"
        {...(r.neto < 0n ? { color: colors.redText } : {})}
      />
      <Cifra
        label="Cuadraron"
        value={`${r.cuadraron} de ${r.cortes}`}
        hint="Sin diferencia alguna"
        color={colors.greenText}
      />
    </section>
  );
}
