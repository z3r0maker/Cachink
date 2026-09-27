'use client';

import type { IsoDate } from '@xangarro/domain';
import { useState } from 'react';

import { DataTable, Pager, ScreenBody, SegmentedTabs, type Pagina } from '@/components';
import type { MovimientosVista } from '@/server/movimientos';
import { resolveScreenState } from '@/session/gating';

import { COLUMNS, CategoryChips, Heading, SearchAndRange, type Row } from './parts';
import { DetalleMovimiento } from './detalle-drawer';
import { KpisGastos, KpisVentas } from './kpi-cards';
import { delFiltro } from './kpis';
import { chips as rangeChips } from './periodo';
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

function Body({ m, vista }: { readonly m: Movimientos; readonly vista: MovimientosVista | null }) {
  const [abierto, setAbierto] = useState<Row | null>(null);
  const tab = m.estado.tab;
  return (
    <ScreenBody
      state={resolveScreenState({ error: vista === null, isEmpty: (vista?.total ?? 0) === 0 })}
      onRetry={() => window.location.reload()}
      empty={{
        title: `Aún no hay ${tab === 'gastos' ? 'gastos' : 'ventas'} en este periodo`,
        body: 'Lo que se cobre en tus cajas aparecerá aquí.',
      }}
    >
      {vista === null ? null : (
        <div aria-busy={m.pendiente}>
          <DataTable
            caption="Movimientos"
            columns={COLUMNS}
            rows={vista.filas}
            rowKey={(r) => r.id}
            minWidth={820}
            onRowClick={setAbierto}
            footer={<Pager p={paginaDe(vista, m.moverPagina)} noun="movimientos" />}
          />
          <DetalleMovimiento row={abierto} rows={vista.lineas} onClose={() => setAbierto(null)} />
        </div>
      )}
    </ScreenBody>
  );
}

export function MovimientosScreen({ estado, hoy, vista }: MovimientosScreenProps) {
  const m = useMovimientos(estado);
  const grupos = delFiltro(vista?.grupos ?? [], estado.cat);
  return (
    <>
      <Heading kind={m.estado.tab} />
      <SegmentedTabs
        ariaLabel="Movimientos"
        value={m.estado.tab}
        onValueChange={m.onTab}
        tabs={[
          { value: 'ventas', label: 'Ventas', count: vista?.conteos.ventas ?? 0 },
          { value: 'gastos', label: 'Gastos', count: vista?.conteos.gastos ?? 0 },
        ]}
      />
      {estado.tab === 'gastos' ? <KpisGastos grupos={grupos} /> : <KpisVentas grupos={grupos} />}
      <SearchAndRange
        query={m.query}
        onQuery={m.onQuery}
        range={m.estado.rango}
        onRange={m.setRange}
        ranges={rangeChips(hoy)}
        custom={{ desde: m.estado.desde, hasta: m.estado.hasta }}
        onCustom={m.setCustom}
      />
      <CategoryChips
        chips={(vista?.grupos ?? []).map((g) => g.clasificacion)}
        filter={m.estado.cat}
        onFilter={m.setFilter}
      />
      <Body m={m} vista={vista} />
    </>
  );
}
