'use client';

import Link from 'next/link';
import { startTransition, useActionState, useState } from 'react';

import { quitarXmlAction, registrarConXmlAction } from '@/server/actions/empresa-registrar-xml';
import { notaRetenciones, type PanelXml } from '@/server/empresa/registrar-xml-view';
import * as d from '@/styles/mostrador-data.css';
import * as mx from '@/styles/mostrador-registrar-xml.css';
import * as m from '@/styles/mostrador.css';

import { CATEGORIAS } from './del-gasto';
import { Campo, Opciones, submitWith, type Opcion } from './opciones';

/** «contador.xml leído · vigente en el SAT», with «Quitar» to start over without it. */
function Adjunto({ panel }: { readonly panel: PanelXml }) {
  const [state, quitar, pending] = useActionState(quitarXmlAction, null);
  const onQuitar = () => {
    const form = new FormData();
    form.append('uuid', panel.uuid);
    startTransition(() => quitar(form));
  };
  return (
    <div className={mx.adjunto}>
      <svg
        className={mx.adjuntoIcono}
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
      <div className={mx.adjuntoTexto}>
        <span className={mx.adjuntoTitulo}>{panel.titulo}</span>
        <span className={mx.adjuntoSub}>{panel.sub}</span>
        {state !== null && !state.ok ? (
          <p className={d.messageBad} role="alert">
            {state.message}
          </p>
        ) : null}
      </div>
      <button className={m.boton.secundario} type="button" disabled={pending} onClick={onQuitar}>
        Quitar
      </button>
    </div>
  );
}

function Campos({
  panel,
  fecha,
  onFecha,
}: {
  readonly panel: PanelXml;
  readonly fecha: string;
  readonly onFecha: (fecha: string) => void;
}) {
  return (
    <>
      <Campo label="Proveedor" name="proveedor" readOnly value={panel.proveedor} />
      <Campo
        label="Concepto"
        name="concepto"
        required
        autoComplete="off"
        defaultValue={panel.concepto}
      />
      <div className={d.fields}>
        {panel.pagada ? (
          <Campo
            label="Fecha de pago"
            name="fecha"
            type="date"
            required
            value={fecha}
            onChange={(e) => onFecha(e.target.value)}
          />
        ) : null}
        <Campo label="Subtotal" name="subtotal" readOnly value={panel.subtotal} />
      </div>
    </>
  );
}

/** The XML's figures; withholdings are owed to the SAT, not spent. */
function DelXml({ panel, fecha }: { readonly panel: PanelXml; readonly fecha: string }) {
  return (
    <section className={mx.delXml} aria-labelledby="del-xml">
      <h3 id="del-xml" className={mx.delXmlTitulo}>
        Del XML
      </h3>
      <dl className={mx.delXmlLista}>
        {panel.montos.map((x) => (
          <div key={x.label} className={mx.delXmlFila}>
            <dt>{x.label}</dt>
            <dd className={mx.delXmlValor[x.tono]}>{x.value}</dd>
          </div>
        ))}
      </dl>
      {panel.conRetenciones ? (
        <span className={mx.delXmlNota}>{notaRetenciones(fecha, panel.pagada)}</span>
      ) : null}
    </section>
  );
}

/**
 * Registrar gasto with one XML attached (E-11, board CD-06d): the supplier
 * and figures come from the XML; the founder words the concept, says when a
 * paid invoice left the bank, and picks the category and project.
 */
export function ConXml({
  panel,
  proyectos,
}: {
  readonly panel: PanelXml;
  readonly proyectos: readonly Opcion[];
}) {
  const [state, action, pending] = useActionState(registrarConXmlAction, null);
  const [fecha, setFecha] = useState(panel.fecha);
  return (
    <form onSubmit={submitWith(action)} className={d.form} aria-label="Registrar gasto con XML">
      <input type="hidden" name="uuid" value={panel.uuid} />
      <Adjunto panel={panel} />
      <Campos panel={panel} fecha={fecha} onFecha={setFecha} />
      <DelXml panel={panel} fecha={fecha} />
      <Opciones
        legend="Categoría"
        name="categoria"
        opciones={CATEGORIAS}
        value={panel.categoria ?? ''}
      />
      <span className={d.hint}>{panel.nota}</span>
      <Opciones legend="Proyecto" name="proyecto" opciones={proyectos} value={panel.proyecto} />
      <span className={d.hint}>El XML se guarda en el Expediente junto con el movimiento.</span>
      {state !== null && !state.ok ? (
        <p className={d.messageBad} role="alert">
          {state.message}
        </p>
      ) : null}
      <div className={m.row}>
        <Link className={m.boton.quieto} href="/empresa/movimientos">
          Cancelar
        </Link>
        <button className={m.boton.primario} type="submit" disabled={pending}>
          Registrar gasto
        </button>
      </div>
    </form>
  );
}
