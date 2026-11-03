import type { Route } from 'next';
import Link from 'next/link';

import type { FilaFactura } from '@/server/empresa/facturas-view';
import * as d from '@/styles/mostrador-data.css';

import { Celdas } from './celdas';
import { FilaPorPagar } from './por-pagar';

/** The received invoices of the month (E-11, board CD-06b). */
function Fila({ f }: { readonly f: FilaFactura }) {
  const destino = f.destino;
  return (
    <tr className={d.rowOpen} data-testid="factura-recibida">
      <Celdas f={f} />
      <td className={d.td}>
        {destino.tipo === 'enlace' ? (
          <Link className={d.rowLink} href={destino.href as Route}>
            {destino.texto}
          </Link>
        ) : destino.tipo === 'texto' ? (
          <span className={d.cellSub}>{destino.texto}</span>
        ) : null}
      </td>
    </tr>
  );
}

const ENCABEZADOS = [
  { id: 'Fecha', num: false },
  { id: 'Proveedor', num: false },
  { id: 'Subtotal', num: true },
  { id: 'IVA', num: true },
  { id: 'Retenciones', num: true },
  { id: 'Estado SAT', num: false },
  { id: 'Movimiento', num: false },
] as const;

function Encabezados() {
  return (
    <tr>
      {ENCABEZADOS.map((c) => (
        <th key={c.id} className={c.num ? d.thNum : d.th} scope="col">
          {c.id}
        </th>
      ))}
    </tr>
  );
}

export function Tabla({
  filas,
  hoy,
  mes,
}: {
  readonly filas: readonly FilaFactura[];
  /** Today, `YYYY-MM-DD`: the latest an invoice can be paid. */
  readonly hoy: string;
  /** The month on screen, `YYYY-MM`, where «Cancelar» comes back to. */
  readonly mes: string;
}) {
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
          <Encabezados />
        </thead>
        <tbody>
          {filas.map((f) =>
            f.destino.tipo === 'por_pagar' ? (
              <FilaPorPagar key={f.key} f={f} destino={f.destino} hoy={hoy} mes={mes} />
            ) : (
              <Fila key={f.key} f={f} />
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
