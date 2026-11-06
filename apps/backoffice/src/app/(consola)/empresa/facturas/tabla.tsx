import type { Route } from 'next';
import Link from 'next/link';

import type { Destino, EstadoFila, FilaFactura } from '@/server/empresa/facturas-view';
import * as mf from '@/styles/mostrador-facturas.css';
import * as d from '@/styles/mostrador-data.css';
import * as ms from '@/styles/mostrador-sat.css';
import * as m from '@/styles/mostrador.css';

import { FilaAvisoSat } from './aviso-sat';
import { ConsultarSat } from './consultar-sat';
import { FilaPorPagar } from './por-pagar';

/** The received invoices of the month (E-11, boards CD-06b and CD-06g). */
const ESTADO_TAG: Record<EstadoFila, string> = {
  Vigente: m.tag.ok,
  'Sin verificar': mf.tono.aviso,
  Cancelada: mf.tono.alerta,
  'Cancelada en el SAT': ms.tagCancelada,
  'Sin CFDI': m.tag.off,
};

/** The tag, and what the SAT column offers beyond it (board CD-06g). */
function EstadoSat({ f }: { readonly f: FilaFactura }) {
  const tag = <span className={`${m.tagBase} ${ESTADO_TAG[f.estado]}`}>{f.estado}</span>;
  if (f.sat.tipo === 'consultar') {
    return (
      <ConsultarSat uuid={f.sat.uuid} mes={f.sat.mes} proveedor={f.proveedor}>
        {tag}
      </ConsultarSat>
    );
  }
  if (f.sat.tipo !== 'confirmada') return tag;
  return (
    <div className={ms.columna}>
      {tag}
      <span className={ms.confirmada} role="status">
        El SAT la confirmó hoy
      </span>
    </div>
  );
}

/** Every cell but «Movimiento». */
function Celdas({ f }: { readonly f: FilaFactura }) {
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
        <EstadoSat f={f} />
      </td>
    </>
  );
}

function Movimiento({ destino }: { readonly destino: Exclude<Destino, { tipo: 'por_pagar' }> }) {
  return (
    <td className={d.td}>
      {destino.tipo === 'texto' ? (
        <span className={d.cellSub}>{destino.texto}</span>
      ) : (
        <Link className={d.rowLink} href={destino.href as Route}>
          {destino.texto}
        </Link>
      )}
    </td>
  );
}

function Fila({ f, hoy }: { readonly f: FilaFactura; readonly hoy: string }) {
  const { destino, proveedor, subtotal, iva } = f;
  if (destino.tipo === 'por_pagar') {
    return (
      <FilaPorPagar pago={destino.pago} {...{ proveedor, subtotal, iva, hoy }}>
        <Celdas f={f} />
      </FilaPorPagar>
    );
  }
  if (f.sat.tipo === 'aviso') {
    return (
      <FilaAvisoSat
        pago={f.sat.pago}
        cancelable={f.sat.cancelable}
        {...{ proveedor, subtotal, iva }}
      >
        <Celdas f={f} />
        <Movimiento destino={destino} />
      </FilaAvisoSat>
    );
  }
  return (
    <tr className={d.rowOpen} data-testid="factura-recibida">
      <Celdas f={f} />
      <Movimiento destino={destino} />
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

export function Tabla({
  filas,
  hoy,
}: {
  readonly filas: readonly FilaFactura[];
  /** `YYYY-MM-DD` in Mexico, the payment date «Registrar pago» offers first. */
  readonly hoy: string;
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
            <Fila key={f.key} f={f} hoy={hoy} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
