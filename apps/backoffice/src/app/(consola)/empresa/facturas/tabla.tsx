import type { Route } from 'next';
import Link from 'next/link';

import type { EstadoFila, FilaFactura } from '@/server/empresa/facturas-view';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as m from '@/styles/mostrador.css';

import { PorPagar } from './por-pagar';

/** The received invoices of the month (E-11, board CD-06b). */
const ESTADO_TAG: Record<EstadoFila, string> = {
  Vigente: m.tag.ok,
  'Sin verificar': mf.tono.aviso,
  Cancelada: mf.tono.alerta,
  'Sin CFDI': m.tag.off,
};

function Destino({ f }: { readonly f: FilaFactura }) {
  const destino = f.destino;
  if (destino.tipo === 'por_pagar') return <PorPagar uuid={destino.uuid} proveedor={f.proveedor} />;
  if (destino.tipo === 'texto') return <span className={d.cellSub}>{destino.texto}</span>;
  return (
    <Link className={d.rowLink} href={destino.href as Route}>
      {destino.texto}
    </Link>
  );
}

function Fila({ f }: { readonly f: FilaFactura }) {
  return (
    <tr className={d.rowOpen} data-testid="factura-recibida">
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
      <td className={d.td}>
        <Destino f={f} />
      </td>
    </tr>
  );
}

const COLUMNAS = [
  { id: 'Fecha', num: false },
  { id: 'Proveedor', num: false },
  { id: 'Subtotal', num: true },
  { id: 'IVA', num: true },
  { id: 'Retenciones', num: true },
  { id: 'Estado SAT', num: false },
  { id: 'Movimiento', num: false },
] as const;

export function Tabla({ filas }: { readonly filas: readonly FilaFactura[] }) {
  if (filas.length === 0) {
    return (
      <p className={d.empty}>
        Este mes todavía no tiene facturas recibidas. Sube sus XML para registrarlas.
      </p>
    );
  }
  return (
    <div className={d.tableWrap}>
      <table className={d.table}>
        <thead>
          <tr>
            {COLUMNAS.map((c) => (
              <th key={c.id} className={c.num ? d.thNum : d.th} scope="col">
                {c.id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <Fila key={f.key} f={f} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
