'use client';

import type { Fila } from './grid';

export function TablaFilas({
  filas,
  editable,
  setFilas,
}: {
  readonly filas: readonly Fila[];
  readonly editable: boolean;
  readonly setFilas: (fn: (fs: Fila[]) => Fila[]) => void;
}) {
  return (
    <table>
      <thead>
        <tr>
          <th>Producto</th>
          <th>Cantidad</th>
          <th>Costo unitario</th>
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <FilaGrid
            key={f.productoId}
            fila={f}
            editable={editable}
            onCambio={(k, v) =>
              setFilas((fs) => fs.map((x, j) => (j === i ? { ...x, [k]: v } : x)))
            }
          />
        ))}
      </tbody>
    </table>
  );
}

function FilaGrid({
  fila,
  editable,
  onCambio,
}: {
  readonly fila: Fila;
  readonly editable: boolean;
  readonly onCambio: (k: 'cantidad' | 'costo', v: string) => void;
}) {
  return (
    <tr>
      <td>{fila.nombre}</td>
      <td>
        <input
          aria-label={`Cantidad de ${fila.nombre}`}
          value={fila.cantidad}
          disabled={!editable}
          onChange={(e) => onCambio('cantidad', e.target.value)}
          style={{ width: 90, textAlign: 'right' }}
          inputMode="numeric"
        />
      </td>
      <td>
        <input
          aria-label={`Costo de ${fila.nombre}`}
          value={fila.costo}
          disabled={!editable}
          onChange={(e) => onCambio('costo', e.target.value)}
          style={{ width: 110, textAlign: 'right' }}
          inputMode="decimal"
        />
      </td>
    </tr>
  );
}
