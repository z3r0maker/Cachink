'use client';

import { startTransition, useActionState } from 'react';

import { adjuntarXmlAction } from '@/server/actions/empresa-registrar-xml';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as mx from '@/styles/mostrador-registrar-xml.css';
import * as m from '@/styles/mostrador.css';

import { useArrastre } from '../../facturas/arrastre';

/**
 * Registrar gasto's XML zone (E-11, board CD-01): drop or choose one
 * invoice's XML and the form fills itself in (board CD-06d). The input has
 * no name, so the expense form never posts the file itself.
 */
export function AdjuntarXml() {
  const [state, action, pending] = useActionState(adjuntarXmlAction, null);
  const enviar = (files: FileList) => {
    const [file] = files;
    if (file === undefined) return;
    const form = new FormData();
    form.append('xml', file);
    startTransition(() => action(form));
  };
  return (
    <section className={mf.subir} aria-labelledby="adjuntar-xml" {...useArrastre(enviar)}>
      <div className={mf.subirTexto}>
        <h2 id="adjuntar-xml" className={mx.zonaTitulo}>
          Arrastra el XML de la factura
        </h2>
        <span className={mf.subirNota}>Con el XML llenamos proveedor, monto e IVA por ti.</span>
        {state !== null && !state.ok ? (
          <p className={d.messageBad} role="alert">
            {state.message}
          </p>
        ) : null}
      </div>
      <label className={m.boton.secundario}>
        {pending ? 'Leyendo…' : 'Elegir archivo'}
        <input
          className={mf.archivoInput}
          type="file"
          accept=".xml,application/xml,text/xml"
          aria-label="Elegir el XML de la factura"
          disabled={pending}
          onChange={(e) => {
            if (e.currentTarget.files !== null) enviar(e.currentTarget.files);
            e.currentTarget.value = '';
          }}
        />
      </label>
    </section>
  );
}
