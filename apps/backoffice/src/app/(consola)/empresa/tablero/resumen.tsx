import type { Route } from 'next';
import Link from 'next/link';

import type { BannerVista } from '@/server/empresa/tablero-banner';
import type { Arrastre as ArrastreVista, ObjetivoVista } from '@/server/empresa/tablero-partes';
import { hrefTablero } from '@/server/empresa/tablero-view';
import type { VistaTablero } from '@/server/empresa/tablero-vista';
import * as i from '@/styles/mostrador-impuestos.css';
import * as s from '@/styles/mostrador-socios.css';
import * as t from '@/styles/mostrador-tablero.css';
import * as m from '@/styles/mostrador.css';

/** The Tablero's top half (board CD-13b): banner, objectives, rollover; the partners are in `socio.tsx`. */
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
