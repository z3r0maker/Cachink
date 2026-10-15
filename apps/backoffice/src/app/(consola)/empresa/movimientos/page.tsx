import { formatMoney, formatMonth } from '@xangarro/domain';
import { resumenDelMes, type ResumenDelMes } from '@xangarro/domain/corp';
import Link from 'next/link';

import { hoyEnMexico } from '@/server/db/corp';
import { filaDe, mesesVecinos, parseFiltro, parseMes } from '@/server/empresa/movimiento-view';
import { leerMes, type MesDeMovimientos } from '@/server/empresa/movimientos-lectura';
import { filaRecurrente, filasDelMes, parseCategoria } from '@/server/empresa/recurrentes-view';
import { requireFounderPage } from '@/server/founder';
import * as mv from '@/styles/mostrador-movimientos.css';
import * as m from '@/styles/mostrador.css';

import { Buscar, Categorias, Tipos, type Vista } from './filtros';
import { TablaRecurrentes } from './recurrentes';
import { Tabla } from './tabla';

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

function Contenido({ vista, datos }: { readonly vista: Vista; readonly datos: MesDeMovimientos }) {
  if (vista.ver === 'recurrentes') {
    return (
      <TablaRecurrentes
        filas={datos.recurrentes.map((r) => filaRecurrente(r, vista.mes))}
        activos={datos.activos}
      />
    );
  }
  const filas = filasDelMes(datos.movimientos.map(filaDe), datos.recurrentes, vista.mes, vista);
  const vacio =
    datos.movimientos.length === 0 && filas.length === 0
      ? 'Este mes todavía no tiene movimientos. Registra el primero.'
      : 'Ningún movimiento coincide en el mes.';
  return <Tabla filas={filas} vacio={vacio} />;
}

/**
 * Movimientos (E-02, board CD-02): one month of MEXIA's ledger, its bank
 * totals, and every entry with its state, plus the recurring charges still to
 * register. Entries are never edited; a wrong one is reversed from its detail.
 */
export default async function MovimientosPage(props: {
  searchParams: Promise<{ mes?: string; ver?: string; cat?: string; q?: string }>;
}) {
  await requireFounderPage();
  const sp = await props.searchParams;
  const hoy = hoyEnMexico();
  const vista: Vista = {
    mes: parseMes(sp.mes, hoy),
    ver: parseFiltro(sp.ver),
    cat: parseCategoria(sp.cat),
    q: (sp.q ?? '').slice(0, 80),
  };
  const datos = await leerMes(vista.mes, hoy);
  return (
    <div className={m.page}>
      <Encabezado mes={vista.mes} />
      <Totales r={resumenDelMes(datos.movimientos)} />
      <section className={m.panel} aria-label="Movimientos del mes">
        <div className={`${m.pad} ${m.stack}`}>
          <div className={mv.barra}>
            <Tipos vista={vista} recurrentes={datos.recurrentes.length} />
            {vista.ver === 'recurrentes' ? null : <Buscar vista={vista} />}
          </div>
          {vista.ver === 'todos' || vista.ver === 'gastos' ? <Categorias vista={vista} /> : null}
        </div>
        <Contenido vista={vista} datos={datos} />
      </section>
    </div>
  );
}
