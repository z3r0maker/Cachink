'use client';

import Link from 'next/link';

import { IconoSubir } from '../_primeros/iconos';
import * as f from '../_primeros/archivo.css';
import * as p from '../_primeros/primeros.css';
import { lineaDe } from './use-saldos';
import type { LineasProps } from './lineas';
import * as s from './cxc.css';

/** «Prellenar desde CSV», a file input behind a secondary-button label. */
export function BotonCsv({ onArchivo }: { readonly onArchivo: (f: File | null) => void }) {
  return (
    <label className={f.botonArchivo}>
      <IconoSubir />
      Prellenar desde CSV
      <input
        type="file"
        accept=".csv,text/csv"
        className={f.archivoOculto}
        onChange={(e) => {
          onArchivo(e.target.files?.[0] ?? null);
          e.target.value = '';
        }}
      />
    </label>
  );
}

/** «Agregar cliente» (one open pick at a time) and what they owe in all. */
export function PieLineas(props: LineasProps & { readonly total: string }) {
  const usados = new Set(props.lineas.map((l) => l.clienteId));
  const quedan = props.clientes.some((c) => !usados.has(c.id));
  const abierta = props.lineas.some((l) => l.clienteId === '');
  return (
    <div className={s.pie}>
      {props.editable && quedan && !abierta ? (
        <button
          type="button"
          className={s.agregar}
          onClick={() => props.setLineas((ls) => [...ls, lineaDe(undefined, '', '')])}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" aria-hidden="true">
            <path
              d="M5 12h14M12 5v14"
              stroke="currentColor"
              strokeWidth={2.6}
              strokeLinecap="round"
            />
          </svg>
          Agregar cliente
        </button>
      ) : null}
      {props.editable && props.clientes.length === 0 ? (
        <span className={p.nota}>
          Aún no tienes clientes. <Link href="/importar?plantilla=clientes">Impórtalos</Link> para
          capturar lo que te deben.
        </span>
      ) : null}
      <span className={s.teDeben}>
        Te deben <span className={s.teDebenCifra}>{props.total}</span>
      </span>
    </div>
  );
}
