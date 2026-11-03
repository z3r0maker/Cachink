import { formatMoney, formatMonth } from '@xangarro/domain';

import { hoyEnMexico } from '@/server/db/corp';
import { leerFacturas } from '@/server/empresa/facturas-lectura';
import {
  filaFactura,
  filaSinCfdi,
  resumenFacturas,
  type ResumenFacturas,
} from '@/server/empresa/facturas-view';
import { mesesVecinos, parseMes } from '@/server/empresa/movimiento-view';
import { requireFounderPage } from '@/server/founder';
import * as mf from '@/styles/mostrador-facturas.css';
import * as p from '@/styles/mostrador-facturas-paneles.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoDinero } from '../encabezado-dinero';

import { Subir } from './subir';
import { Tabla } from './tabla';

export const dynamic = 'force-dynamic';

const nombreMes = (mes: string) => formatMonth(mes).split(' ')[0] ?? mes;

function tilesDe(r: ResumenFacturas, mes: string) {
  const siguiente = nombreMes(mesesVecinos(mes).siguiente);
  const debe = `${r.porPagar} por pagar: ${formatMoney(r.debido)} a proveedores`;
  return [
    {
      id: 'recibidas',
      label: 'Recibidas',
      value: String(r.recibidas),
      note: r.porPagar === 0 ? 'Ninguna por pagar' : debe,
    },
    {
      id: 'iva',
      label: 'IVA acreditable',
      value: formatMoney(r.ivaAcreditable),
      note: 'De lo pagado; el de una factura a crédito, al pagarla',
    },
    {
      id: 'retenciones',
      label: 'Retenciones por pagar',
      value: formatMoney(r.retenciones),
      note: `Se pagan al SAT el 17 de ${siguiente}`,
    },
    {
      id: 'canceladas',
      label: 'Canceladas',
      value: String(r.canceladas),
      note: 'No se registró en Movimientos',
    },
  ];
}

function Totales({ r, mes }: { readonly r: ResumenFacturas; readonly mes: string }) {
  return (
    <section className={m.tiles} aria-label="Totales de las recibidas">
      {tilesDe(r, mes).map((t) => (
        <div key={t.id} className={m.panelPad} data-testid={`facturas-${t.id}`}>
          <span className={m.tileLabel}>{t.label}</span>
          <span className={m.tileValue}>{t.value}</span>
          <span className={m.tileNote}>{t.note}</span>
        </div>
      ))}
    </section>
  );
}

/**
 * Facturas (E-11, board CD-06b): the month's received invoices with their
 * SAT status and movement, the XML drop zone, and each invoice on credit
 * still owed with «Registrar pago» and «Cancelar». The Emitidas tab waits for
 * E-10; the screen is Dinero's second tab (plan §2).
 */
export default async function FacturasPage(props: {
  searchParams: Promise<{ mes?: string; cancelada?: string }>;
}) {
  await requireFounderPage();
  const q = await props.searchParams;
  const hoy = hoyEnMexico();
  const mes = parseMes(q.mes, hoy);
  const { facturas, sinCfdi } = await leerFacturas(mes);
  const filas = [...facturas.map(filaFactura), ...sinCfdi.map(filaSinCfdi)];
  return (
    <div className={m.page}>
      <EncabezadoDinero actual="/empresa/facturas" mes={mes} />
      <Totales r={resumenFacturas(facturas, sinCfdi)} mes={mes} />
      <Subir />
      <section className={m.panel} aria-labelledby="lista">
        <div className={`${m.pad} ${m.stack}`}>
          <h2 id="lista" className={m.tileLabel}>
            Facturas recibidas en {nombreMes(mes)}
          </h2>
        </div>
        <Tabla filas={filas} hoy={hoy} mes={mes} />
        {q.cancelada === '1' ? (
          <p className={`${m.pad} ${p.hecho}`} role="status">
            Factura cancelada. Su gasto quedó revertido en Movimientos.
          </p>
        ) : null}
        <p className={`${m.pad} ${mf.pie}`}>
          ¿Un proveedor del extranjero sin factura mexicana? Regístralo como gasto y adjunta su
          comprobante en PDF; aparece aquí como «Sin CFDI».
        </p>
      </section>
    </div>
  );
}
