import type { EstadoFila, FilaFactura } from '@/server/empresa/facturas-view';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

/** A received invoice's cells before its «Movimiento» (E-11, board CD-06b). */
const ESTADO_TAG: Record<EstadoFila, string> = {
  Vigente: m.tag.ok,
  'Sin verificar': mf.tono.aviso,
  Cancelada: mf.tono.alerta,
  'Sin CFDI': m.tag.off,
};

export function Celdas({ f }: { readonly f: FilaFactura }) {
  return (
    <>
      <td className={d.td}>{f.fecha}</td>
      <td className={d.td}>
        <span className={mf.nombre}>{f.proveedor}</span>
        <span className={d.cellSub}>{f.sub}</span>
      </td>
      <td className={d.tdNum}>{f.subtotal}</td>
      <td className={d.tdNum}>{f.iva}</td>
      <td className={d.tdNum}>{f.retenciones}</td>
      <td className={d.td}>
        <span className={`${m.tagBase} ${ESTADO_TAG[f.estado]}`}>{f.estado}</span>
      </td>
    </>
  );
}

/** Every column, for the panel row that spans them. */
export const COLUMNAS = 7;
