import type { Route } from 'next';
import Link from 'next/link';

import type { EstadoCfdi, FilaEmitida } from '@/server/empresa/emitidas-view';
import * as d from '@/styles/mostrador-data.css';
import * as me from '@/styles/mostrador-emitidas.css';
import * as mf from '@/styles/mostrador-facturas.css';
import * as m from '@/styles/mostrador.css';

/** The month's issued invoices (E-10, board CD-06i): one row per Stripe payment. */
const ESTADO_TAG: Record<EstadoCfdi, string> = {
  Timbrada: m.tag.ok,
  'Por emitir': mf.tono.aviso,
  'En la global': mf.tono.neutro,
  'Fuera de la global': m.tag.off,
  'Cancelación pedida': mf.tono.aviso,
  Cancelada: mf.tono.alerta,
};

const COLUMNAS = [
  { id: 'Pagada', num: false },
  { id: 'Cliente', num: false },
  { id: 'Subtotal', num: true },
  { id: 'IVA', num: true },
  { id: 'Total', num: true },
  { id: 'CFDI', num: false },
  { id: 'Movimiento', num: false },
] as const;

function Cfdi({ f }: { readonly f: FilaEmitida }) {
  return (
    <div className={me.cfdi}>
      <span className={`${m.tagBase} ${ESTADO_TAG[f.estado]}`}>{f.estado}</span>
      {f.nota === '' ? null : <span className={me.nota}>{f.nota}</span>}
      {f.emitirHref === null ? null : (
        <Link className={m.boton.secundario} href={f.emitirHref as Route}>
          Emitir desde la bandeja
        </Link>
      )}
    </div>
  );
}

function Fila({ f }: { readonly f: FilaEmitida }) {
  return (
    <tr data-testid="factura-emitida">
      <td className={d.td}>{f.fecha}</td>
      <td className={d.td}>
        <span className={mf.nombre}>{f.cliente}</span>
        <span className={d.cellSub}>{f.sub}</span>
      </td>
      <td className={d.tdNum}>{f.subtotal}</td>
      <td className={d.tdNum}>{f.iva}</td>
      <td className={d.tdNum}>{f.total}</td>
      <td className={d.td}>
        <Cfdi f={f} />
      </td>
      <td className={d.td}>
        {f.movimiento.href === null ? (
          <span className={d.cellSub}>{f.movimiento.texto}</span>
        ) : (
          <Link href={f.movimiento.href as Route}>{f.movimiento.texto}</Link>
        )}
      </td>
    </tr>
  );
}

export function TablaEmitidas({ filas }: { readonly filas: readonly FilaEmitida[] }) {
  if (filas.length === 0) {
    return (
      <p className={d.empty}>Este mes todavía no tiene pagos de Stripe ni facturas emitidas.</p>
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
