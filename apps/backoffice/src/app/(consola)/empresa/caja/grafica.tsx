import type { Escenario } from '@xangarro/domain/corp';
import type { Route } from 'next';
import Link from 'next/link';

import { ESCENARIOS, type BarraCaja, type GraficaCaja } from '@/server/empresa/caja-grafica';
import * as c from '@/styles/mostrador-caja.css';
import * as g from '@/styles/mostrador-graficas.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as m from '@/styles/mostrador.css';

/**
 * «Caja al cierre de cada mes» (board CD-15c): each bar an SVG in a 0–100 box,
 * so heights are attributes, never inline styles. A scenario is a link: the
 * page redraws the projection on the server. The bars grow in turn, the real
 * months first, and the reserve line draws (ADR-161).
 */
function Escenarios({ actual }: { readonly actual: Escenario }) {
  return (
    <nav className={c.escenarios} aria-label="Escenario">
      {ESCENARIOS.map(([id, label]) => (
        <Link
          key={id}
          className={m.chip}
          href={(id === 'mantener' ? '/empresa/caja' : `/empresa/caja?escenario=${id}`) as Route}
          aria-current={id === actual ? 'true' : undefined}
          scroll={false}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

function Leyenda({ reserva }: { readonly reserva: string }) {
  return (
    <div className={g.leyenda}>
      <span className={g.leyendaItem}>
        <span className={c.muestra.real} aria-hidden="true" />
        Real
      </span>
      <span className={g.leyendaItem}>
        <span className={c.muestra.proyectada} aria-hidden="true" />
        Proyección
      </span>
      <span className={g.leyendaItem}>
        <span className={c.muestra.reserva} aria-hidden="true" />
        {`Reserva mínima: 3 meses de gastos (${reserva})`}
      </span>
    </div>
  );
}

/** A zero still draws a hairline, so an empty month reads as zero, not as missing. */
const visible = (pct: number) => Math.max(pct, 0.6);

function Barra({ b, reservaAlto }: { readonly b: BarraCaja; readonly reservaAlto: number }) {
  return (
    <li className={g.columna} data-testid="caja-barra" data-real={b.real ? 'si' : 'no'}>
      <span className={g.valorBarra}>{b.valor}</span>
      <div className={g.lienzo}>
        <svg
          className={g.lleno}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect
            x={15}
            width={70}
            y={100 - visible(b.alto)}
            height={visible(b.alto)}
            className={`${b.real ? c.rect.real : c.rect.proyectada} ${mv.crece}`}
          />
          <line
            x1={0}
            x2={100}
            y1={100 - reservaAlto}
            y2={100 - reservaAlto}
            className={`${c.rect.reserva} ${mv.traza}`}
            pathLength={1}
          />
        </svg>
      </div>
      <span className={g.etiquetaBarra}>{b.label}</span>
    </li>
  );
}

export function Grafica({
  g: d,
  escenario,
}: {
  readonly g: GraficaCaja;
  readonly escenario: Escenario;
}) {
  return (
    <section className={`${m.hero} ${m.stack}`} aria-labelledby="caja-grafica">
      <div className={i.cabeza}>
        <div>
          <span className={m.eyebrow}>Caja al cierre de cada mes</span>
          <h2 id="caja-grafica" className={i.total} data-testid="caja-titular">
            {d.titular}
          </h2>
          <p className={i.muted}>{d.explica}</p>
        </div>
        <Escenarios actual={escenario} />
      </div>
      <Leyenda reserva={d.reserva} />
      <div className={c.grafica}>
        <ol className={`${c.barras} ${mv.escalona}`} aria-label="Caja al cierre de cada mes">
          {d.barras.map((b) => (
            <Barra key={b.mes} b={b} reservaAlto={d.reservaAlto} />
          ))}
        </ol>
      </div>
      <p className={i.pasoSub}>
        Desde el primer mes con dinero. El promedio toma los 3 meses cerrados antes de hoy y deja
        aparte el dinero de los socios: un fondeo no esconde lo que se gasta.
      </p>
    </section>
  );
}
