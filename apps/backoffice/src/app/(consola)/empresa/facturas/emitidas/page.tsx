import { formatMoney } from '@xangarro/domain';
import type { Route } from 'next';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { leerEmitidas } from '@/server/empresa/emitidas-lectura';
import type { GlobalDelMes, ResumenEmitidas } from '@/server/empresa/emitidas-view';
import { nombreMes } from '@/server/empresa/fechas';
import { mesesVecinos, parseMes } from '@/server/empresa/movimiento-view';
import { requireFounderPage } from '@/server/founder';
import * as me from '@/styles/mostrador-emitidas.css';
import * as mf from '@/styles/mostrador-facturas.css';
import * as m from '@/styles/mostrador.css';

import { EncabezadoDinero } from '../../encabezado-dinero';
import { PestanasFacturas } from '../pestanas';
import { TablaEmitidas } from './tabla';

export const dynamic = 'force-dynamic';

function tilesDe(r: ResumenEmitidas, mes: string) {
  const pagos = r.pagos === 1 ? '1 pago de Stripe' : `${r.pagos} pagos de Stripe`;
  return [
    {
      id: 'cobrado',
      label: 'Cobrado sin IVA',
      value: formatMoney(r.cobradoSinIva),
      note: `${pagos}: ${formatMoney(r.cobradoConIva)} con IVA`,
    },
    {
      id: 'iva',
      label: 'IVA trasladado',
      value: formatMoney(r.iva),
      note: `Se paga al SAT el 17 de ${nombreMes(mesesVecinos(mes).siguiente)}`,
    },
    {
      id: 'por-emitir',
      label: 'Por emitir',
      value: String(r.porEmitir),
      note: 'Pagos sin CFDI todavía: se emiten desde la bandeja',
    },
    {
      id: 'canceladas',
      label: 'Canceladas',
      value: String(r.canceladas),
      note: 'Por reembolso, con su nota de crédito',
    },
  ];
}

function Totales({ r, mes }: { readonly r: ResumenEmitidas; readonly mes: string }) {
  return (
    <section className={m.tiles} aria-label="Totales de las emitidas">
      {tilesDe(r, mes).map((t) => (
        <div key={t.id} className={m.panelPad} data-testid={`emitidas-${t.id}`}>
          <span className={m.tileLabel}>{t.label}</span>
          <span className={m.tileValue}>{t.value}</span>
          <span className={m.tileNote}>{t.note}</span>
        </div>
      ))}
    </section>
  );
}

/** The month's «Público en general» global: still to issue from the inbox, or stamped. */
function Global({ g, mes }: { readonly g: GlobalDelMes; readonly mes: string }) {
  const pagos = g.pagos === 1 ? '1 pago' : `${g.pagos} pagos`;
  const cierre = g.timbrada ? `Folio fiscal ${g.uuid ?? ''}` : 'Se emite al cerrar el mes';
  return (
    <section className={me.global} aria-labelledby="global">
      <div className={me.globalTexto}>
        <h2 id="global" className={me.globalTitulo}>
          Factura global de {nombreMes(mes)} · Público en general
        </h2>
        <span className={me.globalDetalle}>
          {pagos} de clientes sin datos fiscales · {g.total} con IVA · {cierre}
        </span>
      </div>
      <span className={`${m.tagBase} ${g.timbrada ? m.tag.ok : mf.tono.aviso}`}>
        {g.timbrada ? 'Timbrada' : 'Por emitir'}
      </span>
      {g.bandejaHref === null ? null : (
        <Link className={m.boton.secundario} href={g.bandejaHref as Route}>
          Ver en la bandeja
        </Link>
      )}
    </section>
  );
}

/**
 * Facturas › Emitidas (E-10, board CD-06i): the month's Stripe payments of
 * Xangarro, every one already collected, with its CFDI and its cobro. It only
 * reads; what is left to issue is resolved in the inbox with its folio fiscal.
 */
export default async function EmitidasPage(props: { searchParams: Promise<{ mes?: string }> }) {
  await requireFounderPage();
  const mes = parseMes((await props.searchParams).mes, hoyEnMexico());
  const e = await leerEmitidas(mes);
  return (
    <div className={m.page}>
      <EncabezadoDinero actual="/empresa/facturas" mes={mes} />
      <PestanasFacturas actual="emitidas" mes={mes} />
      <Totales r={e.resumen} mes={mes} />
      {e.global === null ? null : <Global g={e.global} mes={mes} />}
      <section className={m.panel} aria-labelledby="lista">
        <div className={`${m.pad} ${m.stack}`}>
          <h2 id="lista" className={m.tileLabel}>
            Facturas emitidas en {nombreMes(mes)}
          </h2>
        </div>
        <TablaEmitidas filas={e.filas} />
        <p className={`${m.pad} ${mf.pie}`}>
          Cada factura nace de un pago de Stripe, ya cobrado: aquí solo se consulta. Lo que falta
          por emitir se resuelve en la bandeja con su folio fiscal, y el cobro de cada pago llega a
          Movimientos al día siguiente.
        </p>
      </section>
    </div>
  );
}
