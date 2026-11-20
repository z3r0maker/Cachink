import type { Route } from 'next';
import Link from 'next/link';

import type {
  EstadoFila,
  FilaFuera,
  LimiteVista,
  PorAprobar,
} from '@/server/empresa/presupuesto-fuera';
import { hrefPresupuesto, type VistaPresupuesto } from '@/server/empresa/presupuesto-view';
import * as i from '@/styles/mostrador-impuestos.css';
import * as p from '@/styles/mostrador-presupuesto.css';
import * as m from '@/styles/mostrador.css';

import { ResponderSolicitudForm } from './formas-gasto';

/**
 * Board CD-15d's lower panels: «Límite de gasto sin consultar», each
 * founder's use of it this month; and «Fuera del presupuesto», what waits on
 * this founder and the rest with its state.
 */
export function Limite({ l }: { readonly l: LimiteVista }) {
  return (
    <section className={m.panelPad} aria-labelledby="limite">
      <div className={m.stack}>
        <h2 id="limite" className={i.pasoTitulo}>
          Límite de gasto sin consultar
        </h2>
        <span className={i.pasoSub}>
          <strong data-testid="presupuesto-limite">{`${l.monto} al mes por socio`}</strong>
          {` · ${l.texto}`}
        </span>
        {l.socios.map((s) => (
          <div key={s.id} className={p.limite} data-testid="presupuesto-socio">
            <span className={m.row}>
              <strong>{s.nombre}</strong>
              <span className={i.pasoSub}>{`${s.usado} de ${l.monto}`}</span>
            </span>
            <svg
              className={p.limitePista}
              viewBox="0 0 100 10"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <rect className={p.limiteAvance} x={0} y={0} width={s.avance} height={10} />
            </svg>
            <span className={i.pasoSub}>{s.detalle}</span>
          </div>
        ))}
        <span className={i.pasoSub}>
          Cuenta lo que cada socio pidió fuera del presupuesto este mes y se aprobó solo por caber
          en su límite.
        </span>
      </div>
    </section>
  );
}

const TAG: Record<EstadoFila, keyof typeof m.tag> = {
  'Sin aprobación': 'off',
  Aprobado: 'ok',
  Rechazado: 'off',
  'Por aprobar': 'info',
};

function Pendiente({ s, vista }: { readonly s: PorAprobar; readonly vista: VistaPresupuesto }) {
  return (
    <div className={p.solicitud} data-testid="presupuesto-por-aprobar">
      <span className={p.encabezadoSolicitud}>
        <span>{s.concepto}</span>
        <span>{s.monto}</span>
      </span>
      <span className={i.pasoSub}>{s.detalle}</span>
      <span className={i.pasoSub}>{s.efecto}</span>
      <div className={m.row}>
        <ResponderSolicitudForm id={s.id} vista={vista} respuesta="aprobar" />
        <Link className={m.boton.secundario} href={hrefPresupuesto(vista, 'otro', s.id) as Route}>
          Aprobar con otro monto
        </Link>
        <ResponderSolicitudForm id={s.id} vista={vista} respuesta="rechazar" />
      </div>
    </div>
  );
}

function Fila({ f }: { readonly f: FilaFuera }) {
  return (
    <div className={p.fila} data-testid="presupuesto-fuera">
      <span>
        <span className={i.pasoTitulo}>{f.concepto}</span>
        <span className={i.pasoSub}>{f.detalle}</span>
      </span>
      <span className={i.pasoTitulo}>{f.monto}</span>
      <span className={`${m.tagBase} ${m.tag[TAG[f.estado]]}`}>{f.estado}</span>
    </div>
  );
}

interface FueraProps {
  readonly f: { readonly porAprobar: readonly PorAprobar[]; readonly filas: readonly FilaFuera[] };
  readonly vista: VistaPresupuesto;
}

function Filas(props: FueraProps) {
  if (props.f.porAprobar.length === 0 && props.f.filas.length === 0) {
    return (
      <span className={i.muted}>
        {props.vista === 'trimestre'
          ? 'Ningún gasto fuera del presupuesto en el trimestre.'
          : 'Ningún gasto fuera del presupuesto este mes.'}
      </span>
    );
  }
  return (
    <div>
      {props.f.filas.map((f) => (
        <Fila key={f.id} f={f} />
      ))}
    </div>
  );
}

export function Fuera(props: FueraProps) {
  return (
    <section className={m.panelPad} aria-labelledby="fuera">
      <div className={m.stack}>
        <div className={m.row}>
          <h2 id="fuera" className={i.pasoTitulo}>
            Fuera del presupuesto
          </h2>
          <Link
            className={m.boton.secundario}
            href={hrefPresupuesto(props.vista, 'pedir') as Route}
          >
            Pedir un gasto fuera del presupuesto
          </Link>
        </div>
        {props.f.porAprobar.map((s) => (
          <Pendiente key={s.id} s={s} vista={props.vista} />
        ))}
        <Filas {...props} />
        <span className={i.pasoSub}>
          Toda deuda o crédito a cargo de MEXIA requiere a ambos, sin importar el monto.
        </span>
      </div>
    </section>
  );
}
