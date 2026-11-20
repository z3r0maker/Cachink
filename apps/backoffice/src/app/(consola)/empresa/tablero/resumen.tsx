import type { Route } from 'next';
import Link from 'next/link';

import type { BannerVista } from '@/server/empresa/tablero-banner';
import type {
  Arrastre as ArrastreVista,
  ObjetivoVista,
  SocioVista,
} from '@/server/empresa/tablero-partes';
import { hrefTablero } from '@/server/empresa/tablero-view';
import type { VistaTablero } from '@/server/empresa/tablero-vista';
import * as i from '@/styles/mostrador-impuestos.css';
import * as s from '@/styles/mostrador-socios.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

/** The Tablero's top half (board CD-13b): banner, each partner's tile, objectives, rollover. */
export function Banner({ b }: { readonly b: BannerVista }) {
  return (
    <div
      className={`${t.bannerBase} ${t.banner[b.tono]}`}
      role="status"
      data-testid="tablero-banner"
    >
      <span>
        <span className={t.bannerTitulo}>{b.titulo}</span>
        <span className={t.bannerTexto}>{b.texto}</span>
      </span>
      {b.accion === null ? null : (
        <Link className={m.boton.primario} href={b.accion.href as Route}>
          {b.accion.texto}
        </Link>
      )}
    </div>
  );
}

/** Accepted in solid, in review after it, and the dashed line at half the commitment. */
function Barra({ v }: { readonly v: SocioVista }) {
  return (
    <svg className={t.pista} viewBox="0 0 400 26" preserveAspectRatio="none" aria-hidden="true">
      <rect className={t.barra.fondo} x="0" y="6" width="400" height="14" rx="4" />
      <rect
        className={t.barra.revision}
        x="0"
        y="6"
        width={v.anchoRevision * 4}
        height="14"
        rx="4"
      />
      <rect
        className={t.barra.aceptado}
        x="0"
        y="6"
        width={v.anchoAceptado * 4}
        height="14"
        rx="4"
      />
      <line className={t.barra.linea} x1="200" x2="200" y1="0" y2="26" />
    </svg>
  );
}

function Socio({ v }: { readonly v: SocioVista }) {
  return (
    <section
      className={`${m.panelPad} ${m.stack}`}
      aria-label={v.nombre}
      data-testid={`tablero-socio-${v.socio}`}
    >
      <div className={s.heroRow}>
        <span className={s.who}>
          <span className={s.avatar[v.socio]}>{v.iniciales}</span>
          <span className={s.whoName}>{v.nombre}</span>
        </span>
        <span className={`${i.chipBase} ${i.tono[v.tono]}`}>{v.chip}</span>
      </div>
      <div className={s.figures}>
        {(
          [
            ['Comprometido', v.comprometido],
            ['Aceptado', v.aceptado],
            ['En revisión', v.revision],
          ] as const
        ).map(([label, valor]) => (
          <span key={label} className={s.figure}>
            <span className={s.figureLabel}>{label}</span>
            <span
              className={s.figureValue}
              data-testid={`tablero-${label === 'En revisión' ? 'revision' : label.toLowerCase()}-${v.socio}`}
            >
              {valor}
            </span>
          </span>
        ))}
      </div>
      <Barra v={v} />
      <span className={t.leyenda}>Línea: mínimo para cumplir (50 %) · {v.nota}</span>
    </section>
  );
}

export function Socios(props: {
  readonly socios: readonly SocioVista[];
  readonly desbalance: string | null;
}) {
  return (
    <>
      <div className={s.grid2}>
        {props.socios.map((v) => (
          <Socio key={v.socio} v={v} />
        ))}
      </div>
      {props.desbalance === null ? null : (
        <p className={t.aviso} role="status" data-testid="tablero-desbalance">
          {props.desbalance}
        </p>
      )}
    </>
  );
}

export function Objetivos({
  v,
  trimestre,
}: {
  readonly v: VistaTablero;
  readonly trimestre: string;
}) {
  if (v.objetivos.length === 0 && !v.puedeAgregar) return null;
  return (
    <section className={m.panelPad} aria-labelledby="objetivos">
      <div className={s.heroRow}>
        <span className={s.heroText}>
          <h2 id="objetivos" className={s.sectionTitle}>
            Objetivos del trimestre
          </h2>
          <span className={i.muted}>Se miden, no suman valor a la bolsa</span>
        </span>
        {v.puedeAgregar ? (
          <Link
            className={m.boton.secundario}
            href={hrefTablero(trimestre, { panel: 'nuevo-objetivo' }) as Route}
          >
            + Objetivo
          </Link>
        ) : null}
      </div>
      {v.objetivos.map((o) => (
        <Objetivo key={o.id} o={o} />
      ))}
    </section>
  );
}

function Objetivo({ o }: { readonly o: ObjetivoVista }) {
  return (
    <div className={t.objetivo} data-testid="tablero-objetivo">
      <span className={m.stack}>
        <span className={i.muted}>{o.quien}</span>
        <span className={t.tarjetaTitulo}>{o.titulo}</span>
        <span className={t.leyenda}>
          {o.avance} · {o.nota}
        </span>
      </span>
      {o.href === null ? null : (
        <Link className={m.boton.secundario} href={o.href as Route}>
          Actualizar avance
        </Link>
      )}
    </div>
  );
}

export function Arrastre({ a }: { readonly a: ArrastreVista }) {
  return (
    <section className={m.panelPad} aria-labelledby="arrastre" data-testid="tablero-arrastre">
      <h2 id="arrastre" className={s.sectionTitle}>
        {a.titulo}
      </h2>
      <p className={i.muted}>{a.texto}</p>
      {a.filas.map((f) => (
        <div key={f.titulo} className={t.fila}>
          <span>
            <span className={t.tarjetaTitulo}>{f.titulo}</span>
            <span className={t.leyenda}> · {f.porque}</span>
          </span>
          <span className={t.leyenda}>
            {f.quien} · {f.valor ?? 'sin valor'} · No cumplida
          </span>
        </div>
      ))}
    </section>
  );
}
