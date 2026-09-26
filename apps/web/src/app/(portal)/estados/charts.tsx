'use client';

import { Card } from '@/components';
import { formatMoneyEntero, type Desglose, type EstadoDeResultados } from '@xangarro/domain';

import { useState } from 'react';

import type { MermaFila } from '@/server/estados';

import { Cascada } from './cascada';
import { dicho } from './lado-data';
import { MermaDrawer } from './merma-drawer';
import { DonutSvg, PALETA_EGRESOS, PALETA_INGRESOS } from './donut';
import { donutEgresos, donutIngresos, waterfallDeResultados } from './charts-data';
import { donutGrid } from './charts.css';
import { chartSubtitle, chartTitle } from './estados.css';

/**
 * The Resultados charts (P-14), drawn to the design (C-13).
 *
 * These were Recharts until 2026-09-22 and looked it: an axis, a grid, a
 * tooltip and a legend the design has none of, unbordered marks in two
 * colours doing seven jobs, and a donut legend that overflowed its card. The
 * drawing lives in `cascada.tsx` and `donut.tsx`; this file is the two cards
 * around them, and `charts-data.ts` stays the pure shape the tests pin.
 */
export function Waterfall({
  er,
  mermas,
}: {
  readonly er: EstadoDeResultados;
  readonly mermas: readonly MermaFila[];
}) {
  const steps = waterfallDeResultados(er);
  const [merma, setMerma] = useState(false);
  const conMerma = er.merma > 0n && mermas.length > 0;
  return (
    <Card>
      <h3 className={chartTitle}>De lo que vendiste a lo que te quedó</h3>
      <p className={chartSubtitle}>Verde es lo que te queda; rojo, lo que se va.</p>
      <Cascada
        steps={steps}
        hablada={hablada(steps)}
        abrirMerma={conMerma ? () => setMerma(true) : undefined}
      />
      {conMerma ? (
        <MermaDrawer
          abierto={merma}
          onCerrar={() => setMerma(false)}
          mermas={mermas}
          total={er.merma}
        />
      ) : null}
    </Card>
  );
}

/**
 * The cascade's spoken form: every level and every drop, in order, with its
 * money — the bar labels are `<text>` inside one `role="img"`, so a reader
 * that ignored this would get eight loose numbers and no sentence.
 */
function hablada(steps: ReturnType<typeof waterfallDeResultados>): string {
  const partes = steps.map((s) =>
    s.kind === 'resta'
      ? `menos ${dicho(s.label)} ${formatMoneyEntero(s.monto)}`
      : `${dicho(s.label)} ${formatMoneyEntero(s.acumulado)}`,
  );
  return `Cascada del Estado de Resultados: ${partes.join(', ')}.`;
}

/** The two composition donuts under the Resultados statement. */
export function Donuts({ desglose }: { readonly desglose: Desglose }) {
  return (
    <div className={donutGrid}>
      <Card>
        <DonutSvg
          titulo="¿De dónde vienen tus ingresos?"
          etiqueta="INGRESOS"
          slices={donutIngresos(desglose)}
          paleta={PALETA_INGRESOS}
          vacio="Sin ingresos en el periodo."
        />
      </Card>
      <Card>
        <DonutSvg
          titulo="¿En qué se gasta?"
          etiqueta="EGRESOS"
          slices={donutEgresos(desglose)}
          paleta={PALETA_EGRESOS}
          vacio="Sin egresos en el periodo."
        />
      </Card>
    </div>
  );
}
