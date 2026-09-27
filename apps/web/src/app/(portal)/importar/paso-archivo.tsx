'use client';

import Link from 'next/link';

import { Button, MonedaGirando } from '@/components';

import { Aviso } from '../_primeros/aviso';
import { IconoPalomita } from '../_primeros/iconos';
import * as p from '../_primeros/primeros.css';
import type { TemplateMeta } from './plantillas';
import { Revision } from './revision';
import { useImportar, type Importar, type Step } from './use-importar';
import { Zona } from './zona';
import * as a from './archivo.css';
import * as s from './importar.css';

/** Step 2: drop the file, wait for the review, review it, done. */
export function PasoArchivo({ meta }: { readonly meta: TemplateMeta }) {
  const f = useImportar(meta.id);
  const conArchivo = f.file !== null && (f.step.name !== 'archivo' || f.pending);
  return (
    <section className={s.paso} aria-labelledby="paso2">
      <div className={s.pasoCabeza}>
        <h2 id="paso2" className={p.eyebrow}>
          2 · Sube tu archivo
        </h2>
        <span className={p.nota}>{meta.intro}</span>
      </div>
      {f.error !== null ? <Aviso tono="critical">{f.error}</Aviso> : null}
      {conArchivo ? <Panel meta={meta} f={f} /> : <Zona meta={meta} onFile={f.revisar} />}
    </section>
  );
}

function Panel({ meta, f }: { readonly meta: TemplateMeta; readonly f: Importar }) {
  return (
    <div className={p.panel}>
      <Cabeza
        file={f.file}
        filas={f.step.name === 'revision' ? f.step.rows.length : null}
        onCambiar={f.reset}
      />
      {f.step.name === 'revision' ? <Revision rows={f.step.rows} meta={meta} f={f} /> : null}
      {f.step.name === 'listo' ? <Listo step={f.step} meta={meta} onOtro={f.reset} /> : null}
      {f.step.name === 'archivo' ? (
        <p className={a.esperando} role="status">
          <MonedaGirando />
          Revisando tu archivo…
        </p>
      ) : null}
    </div>
  );
}

function Cabeza({
  file,
  filas,
  onCambiar,
}: {
  readonly file: File | null;
  readonly filas: number | null;
  readonly onCambiar: () => void;
}) {
  const kb = Math.max(1, Math.round((file?.size ?? 0) / 1024));
  return (
    <div className={a.cabeza}>
      <span className={a.icono} aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          width={20}
          height={20}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M8 13h2M14 13h2M8 17h2M14 17h2" />
        </svg>
      </span>
      <span className={a.nombre}>
        <span className={a.nombreTexto}>{file?.name ?? ''}</span>
        <span className={a.info}>
          {filas === null ? `${kb} KB` : `${filas} ${filas === 1 ? 'fila' : 'filas'} · ${kb} KB`}
        </span>
      </span>
      <Button variant="ghost" size="sm" onClick={onCambiar}>
        Cambiar archivo
      </Button>
    </div>
  );
}

function Listo({
  step,
  meta,
  onOtro,
}: {
  readonly step: Extract<Step, { name: 'listo' }>;
  readonly meta: TemplateMeta;
  readonly onOtro: () => void;
}) {
  const r = step.result;
  return (
    <div className={a.listo} data-testid="import-listo" role="status">
      <span className={a.listoCirculo} aria-hidden="true">
        <IconoPalomita size={32} grosor={3} />
      </span>
      <h3 className={a.listoTitulo}>¡Listo! Ya están en Xangarro</h3>
      <p className={a.listoTexto}>
        {r.nuevos} nuevos, {r.actualizados} actualizados, {r.sinCambios} sin cambios, {r.omitidos}{' '}
        con error. Llegan a tus cajas en su siguiente sincronización.
      </p>
      <div className={a.listoAcciones}>
        <Button variant="secondary" onClick={onOtro}>
          Importar otro archivo
        </Button>
        {meta.id === 'productos' ? (
          <Link href="/productos" className={a.enlace}>
            Ver mis productos
          </Link>
        ) : null}
      </div>
    </div>
  );
}
