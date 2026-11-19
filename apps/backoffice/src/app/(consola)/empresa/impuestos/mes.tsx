import type { Route } from 'next';
import Link from 'next/link';

import {
  avisoDiferencia,
  chipDelMes,
  heroDe,
  pasosDe,
  type Paso,
} from '@/server/empresa/impuestos-encabezado';
import { enAgenda, pagoDe, papelesDe } from '@/server/empresa/impuestos-papeles';
import {
  hrefImpuestos,
  type DatosImpuestos,
  type MesImpuestos,
} from '@/server/empresa/impuestos-view';
import * as i from '@/styles/mostrador-impuestos.css';
import * as m from '@/styles/mostrador.css';

import { Papeles } from './papeles';
import { Tarjetas } from './tarjetas';

function Check() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Pasos({ pasos }: { readonly pasos: readonly Paso[] }) {
  return (
    <ol className={i.pasos} aria-label="Pasos de la declaración">
      {pasos.map((p) => (
        <li key={p.n} className={i.paso} data-testid="paso" data-hecho={p.hecho ? 'si' : 'no'}>
          <span
            className={`${i.circuloBase} ${i.circulo[p.aviso ? 'aviso' : p.hecho ? 'hecho' : 'pendiente']}`}
          >
            {p.hecho ? <Check /> : p.n}
          </span>
          <span>
            <span className={i.pasoTitulo}>{p.titulo}</span>
            <span className={i.pasoSub}>{p.sub}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function Cabeza({ mes, d }: { readonly mes: MesImpuestos; readonly d: DatosImpuestos }) {
  const h = heroDe(mes, d);
  const chip = chipDelMes(mes, d.hoy);
  const editable = mes.estado !== 'pagada';
  return (
    <div className={i.cabeza}>
      <div className={m.stack}>
        <span className={m.eyebrow}>{h.etiqueta}</span>
        <h2 id="mes" className={i.total} data-testid="impuestos-total">
          {h.total}
        </h2>
        <span className={i.muted}>{h.texto}</span>
      </div>
      <div className={m.row}>
        <span className={`${i.chipBase} ${i.tono[chip.tono]}`} data-testid="impuestos-estado">
          {chip.texto}
        </span>
        {editable ? (
          <Link
            className={mes.declaracion === null ? m.boton.primario : m.boton.quieto}
            href={hrefImpuestos(mes.mes, true) as Route}
            scroll={false}
          >
            {mes.declaracion === null ? 'Capturar la declaración' : 'Editar la declaración'}
          </Link>
        ) : null}
      </div>
    </div>
  );
}

/** The month on screen (board CD-09): what to pay, its steps, the three taxes and the papers. */
export function DelMes({ m: mes, d }: { readonly m: MesImpuestos; readonly d: DatosImpuestos }) {
  const aviso = avisoDiferencia(mes);
  return (
    <section className={`${m.hero} ${m.stack}`} aria-labelledby="mes">
      <Cabeza mes={mes} d={d} />
      <Pasos pasos={pasosDe(mes, d)} />
      {aviso === null ? null : (
        <div className={i.aviso} role="status">
          <span>
            <span className={i.pasoTitulo}>{aviso.titulo}</span>
            <span className={i.pasoSub}>{aviso.texto}</span>
          </span>
          <Link
            className={m.boton.quieto}
            href={`/empresa/movimientos?mes=${mes.mes}&ver=todos` as Route}
          >
            Ver los movimientos del mes
          </Link>
        </div>
      )}
      <Tarjetas m={mes} />
      <Papeles
        mes={mes.mes}
        papeles={papelesDe(mes, d)}
        pago={pagoDe(mes, d)}
        agenda={enAgenda(mes)}
      />
      <span className={i.muted}>
        Estimado de referencia; la declaración la presenta el contador. Las cifras salen de lo
        cobrado y lo pagado en el mes (flujo), como pide RESICO.
      </span>
    </section>
  );
}
