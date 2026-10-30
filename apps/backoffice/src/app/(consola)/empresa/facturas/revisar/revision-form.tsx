'use client';

import { useActionState } from 'react';

import {
  descartarRevisionAction,
  registrarFacturasAction,
} from '@/server/actions/empresa-facturas';
import type { FormState } from '@/server/actions/form-state';
import type { TarjetaRevision } from '@/server/empresa/revision-view';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { CATEGORIAS } from '../../movimientos/registrar/del-gasto';
import { Opciones, submitWith, type Opcion } from '../../movimientos/registrar/opciones';

function Encabezado({ t }: { readonly t: TarjetaRevision }) {
  return (
    <div className={mf.tarjetaHead}>
      <div>
        <span className={mf.proveedor}>{t.proveedor}</span>
        <span className={d.cellSub}>{t.sub}</span>
      </div>
      <span className={`${m.tagBase} ${t.verificada ? m.tag.ok : mf.tono.aviso}`}>
        {t.verificada ? 'Vigente en el SAT' : 'Sin verificar en el SAT'}
      </span>
    </div>
  );
}

/**
 * Board CD-06c's cards (E-11): what each XML says, and the category and
 * project the founder confirms. The supplier's last category comes chosen.
 */
function Tarjeta({
  t,
  proyectos,
}: {
  readonly t: TarjetaRevision;
  readonly proyectos: readonly Opcion[];
}) {
  return (
    <article className={mf.tarjeta} aria-label={t.proveedor} data-testid="factura-por-revisar">
      <input type="hidden" name="uuid" value={t.uuid} />
      <Encabezado t={t} />
      <dl className={mf.montos}>
        {t.montos.map((mo) => (
          <div key={mo.label}>
            <dt className={mf.montoLabel}>{mo.label}</dt>
            <dd className={mf.montoValor}>{mo.value}</dd>
          </div>
        ))}
      </dl>
      <Opciones
        legend="Categoría"
        name={`categoria-${t.uuid}`}
        opciones={CATEGORIAS}
        value={t.categoria ?? ''}
      />
      <span className={d.hint}>{t.nota}</span>
      <Opciones
        legend="Proyecto"
        name={`proyecto-${t.uuid}`}
        opciones={proyectos}
        value={t.proyecto}
      />
    </article>
  );
}

/** The note, «Cancelar» (what waited is set aside) and «Registrar N facturas». */
function Botones({ n, error }: { readonly n: number; readonly error: FormState }) {
  const [salida, descartar, descartando] = useActionState(descartarRevisionAction, null);
  const falla = [error, salida].find((s) => s !== null && !s.ok);
  return (
    <>
      {falla === undefined || falla === null ? null : (
        <p className={d.messageBad} role="alert">
          {falla.message}
        </p>
      )}
      <div className={mf.barraFinal}>
        <span className={mf.pie}>Los XML se guardan en el Expediente junto con su movimiento.</span>
        <form onSubmit={submitWith(() => descartar())}>
          <button className={m.boton.secundario} type="submit" disabled={descartando}>
            Cancelar
          </button>
        </form>
        {n === 0 ? null : (
          <button className={m.boton.primario} type="submit" form="revision">
            {n === 1 ? 'Registrar 1 factura' : `Registrar ${n} facturas`}
          </button>
        )}
      </div>
    </>
  );
}

export function RevisionForm({
  tarjetas,
  proyectos,
  children,
}: {
  readonly tarjetas: readonly TarjetaRevision[];
  readonly proyectos: readonly Opcion[];
  /** What was set aside, between the cards and the buttons. */
  readonly children: React.ReactNode;
}) {
  const [state, registrar] = useActionState(registrarFacturasAction, null);
  return (
    <>
      <form id="revision" className={m.stack} onSubmit={submitWith(registrar)}>
        {tarjetas.map((t) => (
          <Tarjeta key={t.uuid} t={t} proyectos={proyectos} />
        ))}
      </form>
      {children}
      <Botones n={tarjetas.length} error={state} />
    </>
  );
}
