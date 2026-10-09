'use client';

import type { IsoDate, Rango } from '@xangarro/domain';
import { useState } from 'react';

import { DataTable, Pager, ScreenBody, SegmentedTabs, type Pagina } from '@/components';
import type { MovimientosVista } from '@/server/movimientos';
import { resolveScreenState } from '@/session/gating';

import { COLUMNS, CategoryChips, Heading, SearchAndRange, type Row } from './parts';
import { Cargando, FilaError, IrAFecha, PeriodoCaption } from './carga';
import { enPeriodo, tabsFila } from './carga.css';
import { periodoCaption, personalizadoAbierto, vacioDeBusqueda } from './caption';
import { DetalleMovimiento } from './detalle-drawer';
import { KpisGastos, KpisVentas } from './kpi-cards';
import { delFiltro } from './kpis';
import { chips as rangeChips, rangoDe } from './periodo';
import type { EstadoMovimientos } from './url';
import { useMovimientos, type Movimientos } from './use-movimientos';

const POR_PAGINA = 10;

export interface MovimientosScreenProps {
  /** The filters the server answered for, read from the URL. */
  readonly estado: EstadoMovimientos;
  /** The business's today (`server/clock`): the range chips are relative to it. */
  readonly hoy: IsoDate;
  /** `null` when the read failed — the screen renders its error state. */
  readonly vista: MovimientosVista | null;
  /** The folio the search names, when it names one (the server's parse). */
  readonly folio: number | null;
}

/**
 * The shared `Pager` over a page the server cut: the same counter and buttons
 * as a client-side page, with «Siguiente» asking the server for the next ten.
 */
function paginaDe(
  v: MovimientosVista,
  mover: (delta: number, paginas: number) => void,
): Pagina<Row> {
  const pages = Math.max(1, Math.ceil(v.total / POR_PAGINA));
  const from = v.total === 0 ? 0 : (v.pagina - 1) * POR_PAGINA + 1;
  return {
    visible: [...v.filas],
    page: v.pagina - 1,
    pages,
    from,
    to: v.total === 0 ? 0 : from + v.filas.length - 1,
    total: v.total,
    prev: () => mover(-1, pages),
    next: () => mover(1, pages),
  };
}

/**
 * The last page that arrived. A request that fails keeps it on screen, under
 * the error row, instead of emptying the table (DS-01). Adjusted during
 * render, React's pattern for state that follows a prop.
 */
function useUltimaVista(vista: MovimientosVista | null): MovimientosVista | null {
  const [ultima, setUltima] = useState(vista);
  if (vista !== null && vista !== ultima) setUltima(vista);
  return vista ?? ultima;
}

interface TablaProps {
  readonly m: Movimientos;
  readonly vista: MovimientosVista;
  readonly fallo: boolean;
  readonly rango: Rango;
}

/** While the next page is on its way the old rows stay, dimmed, under a bar. */
function Tabla({ m, vista, fallo, rango }: TablaProps) {
  const [abierto, setAbierto] = useState<Row | null>(null);
  return (
    <div aria-busy={m.pendiente}>
      <DataTable
        caption="Movimientos"
        columns={COLUMNS}
        rows={vista.filas}
        rowKey={(r) => r.id}
        minWidth={820}
        onRowClick={setAbierto}
        selectedKey={abierto?.id}
        busy={m.pendiente}
        aviso={fallo ? <FilaError onRetry={m.reintentar} /> : null}
        footer={
          <Pager
            p={paginaDe(vista, m.moverPagina)}
            noun="movimientos"
            extra={<IrAFecha rango={rango} onIr={m.irAFecha} />}
          />
        }
      />
      <DetalleMovimiento row={abierto} rows={vista.lineas} onClose={() => setAbierto(null)} />
    </div>
  );
}

function Body({
  m,
  vista,
  fallo,
  vacio,
  rango,
}: Omit<TablaProps, 'vista'> & {
  readonly vista: MovimientosVista | null;
  readonly vacio: string | null;
}) {
  const tab = m.estado.tab;
  const total = vista?.total ?? 0;
  return (
    <ScreenBody
      state={resolveScreenState({
        error: vista === null || (fallo && total === 0),
        isEmpty: total === 0,
      })}
      onRetry={() => window.location.reload()}
      empty={
        vacio === null
          ? {
              title: `Aún no hay ${tab === 'gastos' ? 'gastos' : 'ventas'} en este periodo`,
              body: 'Lo que se cobre en tus cajas aparecerá aquí.',
            }
          : { title: vacio, body: '' }
      }
    >
      {vista === null ? null : <Tabla m={m} vista={vista} fallo={fallo} rango={rango} />}
    </ScreenBody>
  );
}

/** The tab counts follow the period and the search (owner decision 3), and say so. */
function Pestanas({
  m,
  vista,
}: {
  readonly m: Movimientos;
  readonly vista: MovimientosVista | null;
}) {
  return (
    <div className={tabsFila}>
      <SegmentedTabs
        ariaLabel="Movimientos"
        value={m.estado.tab}
        onValueChange={m.onTab}
        tabs={[
          { value: 'ventas', label: 'Ventas', count: vista?.conteos.ventas ?? 0 },
          { value: 'gastos', label: 'Gastos', count: vista?.conteos.gastos ?? 0 },
        ]}
      />
      <span className={enPeriodo}>en este periodo</span>
    </div>
  );
}

export function MovimientosScreen({ estado, hoy, vista, folio }: MovimientosScreenProps) {
  const m = useMovimientos(estado);
  const mostrada = useUltimaVista(vista);
  const grupos = delFiltro(mostrada?.grupos ?? [], estado.cat);
  const rango = rangoDe(estado.rango, hoy, { desde: estado.desde, hasta: estado.hasta });
  return (
    <>
      <Heading kind={m.estado.tab} />
      <Pestanas m={m} vista={mostrada} />
      {estado.tab === 'gastos' ? <KpisGastos grupos={grupos} /> : <KpisVentas grupos={grupos} />}
      <PeriodoCaption texto={periodoCaption(estado.rango, rango, hoy, estado.q)} />
      <SearchAndRange
        query={m.query}
        onQuery={m.onQuery}
        range={m.estado.rango}
        onRange={m.setRange}
        ranges={rangeChips(hoy)}
        custom={{ desde: m.estado.desde, hasta: m.estado.hasta }}
        onCustom={m.setCustom}
        lento={personalizadoAbierto(m.estado.rango, m.estado.desde, m.estado.hasta)}
      />
      <CategoryChips
        chips={(mostrada?.grupos ?? []).map((g) => g.clasificacion)}
        filter={m.estado.cat}
        onFilter={m.setFilter}
      />
      <Cargando pendiente={m.pendiente} />
      <Body
        m={m}
        vista={mostrada}
        fallo={vista === null}
        vacio={vacioDeBusqueda(estado.tab, estado.q, folio)}
        rango={rango}
      />
    </>
  );
}
