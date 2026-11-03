import type { Route } from 'next';
import Link from 'next/link';

import type { ItemAgenda } from '@/server/empresa/agenda-view';
import type { Senal } from '@/server/empresa/resumen-senales';
import type { FilaPuente, Kpi } from '@/server/empresa/resumen-view';
import * as a from '@/styles/mostrador-agenda.css';
import * as g from '@/styles/mostrador-graficas.css';
import * as p from '@/styles/mostrador-resumen-paneles.css';
import * as r from '@/styles/mostrador-resumen.css';
import * as m from '@/styles/mostrador.css';

/** The Resumen under its hero (E-16, board CD-12b): tiles, profit bars, signals, due items. */
export function Indicadores({ kpis }: { readonly kpis: readonly Kpi[] }) {
  return (
    <section className={m.tiles} aria-label="Indicadores">
      {kpis.map((k) => (
        <Link key={k.label} className={r.kpi} href={k.href as Route} data-testid="kpi">
          <span className={m.eyebrow}>{k.label}</span>
          <span className={r.cifra}>{k.valor}</span>
          <span className={r.cambio[k.tono]}>{k.cambio}</span>
          <span className={r.ref}>{k.ref}</span>
        </Link>
      ))}
    </section>
  );
}

function Barra({ f }: { readonly f: FilaPuente }) {
  const ancho = Math.max(f.ancho, 0.6);
  return (
    <svg className={p.pista} viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
      <rect className={g.rol[f.rol]} x={0} y={0} width={ancho} height={10} rx={0.6} />
    </svg>
  );
}

export function Utilidad(props: {
  readonly filas: readonly FilaPuente[];
  readonly nota: string;
  readonly href: string;
}) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="utilidad">
      <div className={r.panelCabeza}>
        <h2 id="utilidad" className={r.panelTitulo}>
          De dónde sale la utilidad
        </h2>
        <Link className={m.boton.secundario} href={props.href as Route}>
          Ver resultados
        </Link>
      </div>
      {props.filas.map((f) => (
        <div key={f.label} className={p.fila} data-testid="utilidad-fila">
          <span className={f.fuerte ? p.etiqueta.fuerte : p.etiqueta.normal}>{f.label}</span>
          <Barra f={f} />
          <span
            className={
              f.rol === 'perdida' ? p.valor.perdida : f.fuerte ? p.valor.fuerte : p.valor.normal
            }
          >
            {f.valor}
          </span>
        </div>
      ))}
      <p className={r.tenue}>{props.nota}</p>
    </section>
  );
}

const AVISO =
  'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0zM12 9v4M12 17h.01';

export function Senales({ senales }: { readonly senales: readonly Senal[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="senales">
      <h2 id="senales" className={r.panelTitulo}>
        Señales
      </h2>
      {senales.length === 0 ? <span className={p.sinSenales}>Sin señales este mes.</span> : null}
      {senales.map((s) => (
        <div key={s.titulo} className={p.senal[s.tono]} data-testid="senal">
          <span className={p.icono[s.tono]}>
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={AVISO} />
            </svg>
          </span>
          <div className={p.senalTexto}>
            <span className={p.fuerte}>{s.titulo}</span>
            <span className={p.detalle}>{s.porque}</span>
          </div>
          <Link className={m.boton.secundario} href={s.href as Route}>
            {s.accion}
          </Link>
        </div>
      ))}
    </section>
  );
}

export function Vencimientos({ items }: { readonly items: readonly ItemAgenda[] }) {
  return (
    <section className={`${m.panelPad} ${m.stack}`} aria-labelledby="vencimientos">
      <div className={r.panelCabeza}>
        <h2 id="vencimientos" className={r.panelTitulo}>
          Próximos vencimientos
        </h2>
        <Link className={m.boton.secundario} href={'/empresa/agenda' as Route}>
          Ver agenda
        </Link>
      </div>
      {items.length === 0 ? (
        <p className={r.tenue}>Nada pendiente en los próximos seis meses.</p>
      ) : (
        <div>
          {items.map((i) => (
            <div key={i.key} className={p.vencimiento} data-testid="vencimiento">
              <div className={p.vencimientoTexto}>
                <Link className={p.vencimientoLiga} href={i.href}>
                  {i.titulo}
                </Link>
                <span className={p.detalle}>
                  {i.autoridad} · {i.fecha} · {i.falta}
                </span>
              </div>
              <span className={a.chip[i.tono]}>{i.estado}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
