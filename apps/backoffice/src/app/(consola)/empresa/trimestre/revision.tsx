import type { Route } from 'next';
import Link from 'next/link';

import { Odometro } from '@/components/odometro';
import type { Linea, ObjetivoTrimestre, SocioTrimestre } from '@/server/empresa/trimestre-revision';
import * as g from '@/styles/mostrador-graficas.css';
import * as i from '@/styles/mostrador-impuestos.css';
import * as mv from '@/styles/mostrador-movimiento.css';
import * as s from '@/styles/mostrador-socios.css';
import * as q from '@/styles/mostrador-trimestre.css';
import * as m from '@/styles/mostrador.css';

/**
 * The quarter's review (board CD-17b): objectives, partners and the Tablero,
 * compliance. Each panel enters in turn, a partner's bar fills and the count
 * rolls (ADR-161).
 */
const MARCA = { si: '✓', no: '✕', curso: '…' } as const;

export function Objetivos(props: {
  readonly titulo: string;
  readonly filas: readonly ObjetivoTrimestre[];
}) {
  return (
    <section className={`${m.panelPad} ${m.stack} ${mv.entra}`} aria-labelledby="objetivos">
      <h2 id="objetivos" className={s.sectionTitle}>
        {props.titulo}
      </h2>
      {props.filas.length === 0 ? (
        <span className={i.muted}>El trimestre no tuvo objetivos en el Tablero.</span>
      ) : null}
      {props.filas.map((o) => (
        <div key={o.titulo} className={q.fila} data-testid="trimestre-objetivo">
          <span className={`${q.marcaBase} ${q.marca[o.marca]}`} aria-hidden="true">
            {MARCA[o.marca]}
          </span>
          <span className={m.stack}>
            <span className={s.whoName}>{o.titulo}</span>
            <span className={q.nota}>{o.resultado}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

/** A partner's share of the Tablero's accepted value, filling from the left. */
function Pista({ ancho }: { readonly ancho: number }) {
  return (
    <svg className={q.pista} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
      <rect x={0} y={0} width={100} height={10} rx={3} className={q.fondoPista} />
      <rect
        x={0}
        y={0}
        width={ancho}
        height={10}
        rx={3}
        className={`${g.rol.ingreso} ${mv.llena}`}
      />
    </svg>
  );
}

export function Socios(props: {
  readonly filas: readonly SocioTrimestre[];
  readonly fondeo: string;
  readonly tableroHref: string;
}) {
  return (
    <section className={`${m.panelPad} ${m.stack} ${mv.entra}`} aria-labelledby="socios-tablero">
      <div className={s.heroRow}>
        <h2 id="socios-tablero" className={s.sectionTitle}>
          Socios y Tablero
        </h2>
        <Link className={m.boton.secundario} href={props.tableroHref as Route} data-no-imprimir>
          Ver Tablero
        </Link>
      </div>
      {props.filas.map((p) => (
        <div key={p.socio} className={m.stack} data-testid={`trimestre-socio-${p.socio}`}>
          <span className={s.heroRow}>
            <span className={s.whoName}>{p.nombre}</span>
            <span className={`${i.chipBase} ${i.tono[p.tono]}`}>{p.chip}</span>
          </span>
          <Pista ancho={p.ancho} />
          <span className={q.nota}>{p.detalle}</span>
        </div>
      ))}
      <span className={q.nota}>{props.fondeo}</span>
    </section>
  );
}

export function Cumplimiento(props: {
  readonly cuenta: string;
  readonly lineas: readonly Linea[];
}) {
  return (
    <section
      className={`${m.panelPad} ${m.stack} ${mv.entra}`}
      aria-labelledby="cumplimiento"
      data-testid="trimestre-cumplimiento"
    >
      <h2 id="cumplimiento" className={s.sectionTitle}>
        Cumplimiento
      </h2>
      <span>
        <Odometro className={q.cuenta} texto={props.cuenta} />{' '}
        <span className={i.muted}>obligaciones a tiempo, con evidencia</span>
      </span>
      {props.lineas.map((l) => (
        <span key={l.texto} className={l.alerta ? q.alerta : i.pasoSub}>
          {l.texto}
        </span>
      ))}
      <Link
        className={m.boton.secundario}
        href={'/empresa/agenda/evidencias' as Route}
        data-no-imprimir
      >
        Ver evidencias
      </Link>
    </section>
  );
}
