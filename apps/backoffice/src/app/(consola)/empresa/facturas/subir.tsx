'use client';

import { startTransition, useActionState, useState, type DragEvent } from 'react';

import { subirFacturasAction } from '@/server/actions/empresa-facturas';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

/** Drop handlers for the zone: it lights up while files hover over it. */
function useArrastre(enviar: (files: FileList) => void) {
  const [arrastrando, setArrastrando] = useState(false);
  return {
    'data-arrastrando': arrastrando,
    onDragOver: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setArrastrando(true);
    },
    onDragLeave: () => setArrastrando(false),
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      setArrastrando(false);
      enviar(e.dataTransfer.files);
    },
  };
}

function Texto({ error }: { readonly error: string | null }) {
  return (
    <div className={mf.subirTexto}>
      <h2 id="subir" className={mf.subirTitulo}>
        Arrastra aquí los XML de tus facturas
      </h2>
      <span className={mf.subirNota}>
        Puedes subir varios a la vez. Con el XML llenamos proveedor, montos, IVA y retenciones, y
        revisamos con el SAT que siga vigente.
      </span>
      {error === null ? null : (
        <p className={d.messageBad} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The XML drop zone (E-11, board CD-06b): drop several files or choose
 * them; they upload at once and the review opens. A plain file input
 * underneath, so the keyboard and screen readers work.
 */
export function Subir() {
  const [state, action, pending] = useActionState(subirFacturasAction, null);
  const enviar = (files: FileList) => {
    if (files.length === 0) return;
    const form = new FormData();
    for (const f of files) form.append('xml', f);
    startTransition(() => action(form));
  };
  return (
    <section className={mf.subir} aria-labelledby="subir" {...useArrastre(enviar)}>
      <Texto error={state !== null && !state.ok ? state.message : null} />
      <label className={m.boton.primario}>
        {pending ? 'Revisando…' : 'Elegir archivos'}
        <input
          className={mf.archivoInput}
          type="file"
          name="xml"
          accept=".xml,application/xml,text/xml"
          multiple
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
