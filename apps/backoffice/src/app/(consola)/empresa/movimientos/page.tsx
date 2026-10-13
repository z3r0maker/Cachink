import { listMovimientos } from '@xangarro/data-corp';
import { formatMoney, formatMonth } from '@xangarro/domain';
import { resumenDelMes, type ResumenDelMes } from '@xangarro/domain/corp';
import Link from 'next/link';

import { hoyEnMexico, requireCorpDb } from '@/server/db/corp';
import { filaDe, mesesVecinos, parseFiltro, parseMes } from '@/server/empresa/movimiento-view';
import { requireFounderPage } from '@/server/founder';
import * as m from '@/styles/mostrador.css';

import { Filtros, Tabla } from './tabla';

export const dynamic = 'force-dynamic';

function Totales({ r }: { readonly r: ResumenDelMes }) {
  const tiles = [
    { label: 'Entradas', value: r.entradas, note: 'Lo que llegó al banco' },
    { label: 'Salidas', value: r.salidas, note: 'Gastos, impuestos y comisiones' },
    {
      label: 'Neto',
      value: r.neto,
      note:
        r.fondeoSocios > 0n
          ? `Incluye ${formatMoney(r.fondeoSocios)} de fondeo de socios`
          : `${r.movimientos} movimientos vigentes`,
    },
  ];
  return (
    <section className={m.tiles} aria-label="Totales del mes">
      {tiles.map((t) => (
        <div key={t.label} className={m.panelPad} data-testid={`total-${t.label.toLowerCase()}`}>
          <span className={m.tileLabel}>{t.label}</span>
          <span className={m.tileValue}>{formatMoney(t.value)}</span>
          <span className={m.tileNote}>{t.note}</span>
        </div>
      ))}
    </section>
  );
}

function Encabezado({ mes }: { readonly mes: string }) {
  const { anterior, siguiente } = mesesVecinos(mes);
  const nombre = formatMonth(mes);
  return (
    <header className={m.head}>
      <div className={m.headText}>
        <span className={m.eyebrow}>MEXIA · Empresa</span>
        <h1 className={m.title}>Movimientos</h1>
        <p className={m.sub}>{nombre.charAt(0).toUpperCase() + nombre.slice(1)}</p>
      </div>
      <div className={m.row}>
        <Link className={m.boton.quieto} href={`?mes=${anterior}`}>
          Mes anterior
        </Link>
        <Link className={m.boton.quieto} href={`?mes=${siguiente}`}>
          Mes siguiente
        </Link>
        <Link className={m.boton.primario} href="/empresa/movimientos/registrar">
          + Registrar
        </Link>
      </div>
    </header>
  );
}

/**
 * Movimientos (E-02, board CD-02): one month of MEXIA's ledger, its bank
 * totals, and every entry with its state. Entries are never edited; a wrong
 * one is reversed from its detail.
 */
export default async function MovimientosPage(props: {
  searchParams: Promise<{ mes?: string; ver?: string }>;
}) {
  await requireFounderPage();
  const sp = await props.searchParams;
  const mes = parseMes(sp.mes, hoyEnMexico());
  const filtro = parseFiltro(sp.ver);
  const movimientos = await listMovimientos(requireCorpDb(), mes);
  const filas = movimientos.map(filaDe).filter((f) => filtro === 'todos' || f.filtro === filtro);
  return (
    <div className={m.page}>
      <Encabezado mes={mes} />
      <Totales r={resumenDelMes(movimientos)} />
      <section className={m.panel} aria-label="Movimientos del mes">
        <div className={m.pad}>
          <Filtros mes={mes} activo={filtro} />
        </div>
        <Tabla
          filas={filas}
          vacio={
            movimientos.length === 0
              ? 'Este mes todavía no tiene movimientos. Registra el primero.'
              : 'Ningún movimiento de este tipo en el mes.'
          }
        />
      </section>
    </div>
  );
}
