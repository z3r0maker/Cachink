'use client';

import { dinero } from '../_primeros/formato';
import { IconoSubir } from '../_primeros/iconos';
import { FechaPicker } from '../_primeros/fecha';
import * as f from '../_primeros/archivo.css';
import * as p from '../_primeros/primeros.css';
import * as s from './barra.css';
import * as t from './inventario.css';

/** Over the grid: the count's date and the CSV prefill. */
export function Barra({
  fecha,
  hoy,
  editable,
  onFecha,
  onArchivo,
}: {
  readonly fecha: string;
  readonly hoy: string;
  readonly editable: boolean;
  readonly onFecha: (iso: string) => void;
  readonly onArchivo: (file: File | null) => void;
}) {
  return (
    <div className={s.barra}>
      <FechaPicker
        id="fecha-conteo"
        label="Fecha del conteo"
        dialogo="Elige la fecha del conteo"
        valor={fecha}
        hoy={hoy}
        disabled={!editable}
        onChange={onFecha}
      />
      {editable ? <CsvBoton onArchivo={onArchivo} /> : null}
    </div>
  );
}

function CsvBoton({ onArchivo }: { readonly onArchivo: (file: File | null) => void }) {
  return (
    <div className={s.csv}>
      <span className={p.nota}>columnas: producto, cantidad, costo</span>
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
    </div>
  );
}

export function Cabecera() {
  return (
    <div className={t.cabecera} aria-hidden="true">
      <span>Producto</span>
      <span>Unidad</span>
      <span>Cantidad</span>
      <span>Costo unitario</span>
      <span className={t.derecha}>Valor</span>
    </div>
  );
}

export function Pie({ total }: { readonly total: bigint }) {
  return (
    <div className={s.pie}>
      <span className={s.pieTexto}>
        Los que dejes en blanco empiezan en cero. Solo cantidades enteras.
      </span>
      <span className={s.pieTotal}>{dinero(total)}</span>
    </div>
  );
}
