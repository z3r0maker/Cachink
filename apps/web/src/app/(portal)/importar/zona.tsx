'use client';

import { useState, type DragEvent } from 'react';

import { IconoSubir } from '../_primeros/iconos';
import * as f from '../_primeros/archivo.css';
import type { TemplateMeta } from './plantillas';
import * as s from './importar.css';

const ACCEPT =
  '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

/** Step 2's empty state: drop the file here or look for it. Choosing it starts the review. */
export function Zona({
  meta,
  onFile,
}: {
  readonly meta: TemplateMeta;
  readonly onFile: (f: File | null) => void;
}) {
  const arrastre = useArrastre(onFile);
  return (
    <label className={s.zona} data-encima={arrastre.encima ? '' : undefined} {...arrastre.props}>
      <span className={s.zonaIcono} aria-hidden="true">
        <IconoSubir size={30} />
      </span>
      <span className={s.zonaTitulo}>Arrastra tu archivo (.xlsx o .csv, hasta 2 MB)</span>
      <span className={s.zonaSub}>
        o <span className={s.subrayado}>búscalo en tu compu</span>
      </span>
      <input
        type="file"
        accept={ACCEPT}
        className={f.archivoOculto}
        aria-label={`Archivo de ${meta.label.toLowerCase()}`}
        data-testid="import-archivo"
        onChange={(e) => {
          onFile(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
    </label>
  );
}

/** Drag and drop onto the zone: highlight while over it, take the first file on drop. */
function useArrastre(onFile: (f: File | null) => void) {
  const [encima, setEncima] = useState(false);
  return {
    encima,
    props: {
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        setEncima(true);
      },
      onDragLeave: () => setEncima(false),
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setEncima(false);
        onFile(e.dataTransfer.files[0] ?? null);
      },
    },
  };
}
