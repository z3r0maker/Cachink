'use client';

import { useMemo, useState } from 'react';

import { ScreenBody, useExportar, type Exportacion } from '@/components';
import { useSession } from '@/session/provider';
import type { ProductosData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';

import type { OnRowAction, RowAction } from './columns';
import { ArchivarDialog } from './archivar-dialog';
import { MovimientoDialog } from './movimiento-dialog';
import { ExportarMovimientos, PieMovimientos, Tabs } from './movimientos-tab';
import { EditarProductoSheet } from './sheet/sheet';
import {
  CatalogoTable,
  Chips,
  Heading,
  Kpis,
  KpisMovimientos,
  LowStockBanner,
  MovTable,
  isLow,
  type Movimiento,
  type Producto,
} from './parts';

function Controls({
  c,
  movimientos,
}: {
  readonly c: Catalogo;
  readonly movimientos: readonly Movimiento[];
}) {
  const { catalogo, isCatalogo, setFilter } = c;
  const low = catalogo.filter(isLow).length;
  // Switching tabs resets the filter: the keys are not shared.
  const onTab = (v: string) => {
    c.setTab(v);
    setFilter('Todos');
  };
  return (
    <>
      {isCatalogo && low > 0 ? (
        <LowStockBanner
          low={low}
          negativos={catalogo.filter((p) => p.sigueStock && p.stock < 0).length}
          onShow={() => setFilter('Stock bajo')}
        />
      ) : null}
      <Tabs
        tab={c.tab}
        onChange={onTab}
        catalogCount={catalogo.length}
        movCount={movimientos.length}
      />
      {isCatalogo ? <Kpis rows={catalogo} /> : <KpisMovimientos rows={movimientos} />}
      {isCatalogo ? (
        <Chips filter={c.filter} setFilter={setFilter} />
      ) : (
        <ExportarMovimientos exp={c.exp} />
      )}
    </>
  );
}

function Body({
  isCatalogo,
  rows,
  movimientos,
  error,
  onAction,
  exp,
}: {
  readonly isCatalogo: boolean;
  readonly rows: readonly Producto[];
  readonly movimientos: readonly Movimiento[];
  readonly error: boolean;
  readonly onAction: OnRowAction;
  readonly exp: Exportacion;
}) {
  return (
    <ScreenBody
      state={resolveScreenState({ error, isEmpty: isCatalogo && rows.length === 0 })}
      onRetry={() => window.location.reload()}
      empty={{
        title: 'Aún no tienes productos',
        body: 'Agrega tu primer producto o impórtalos desde Excel.',
      }}
    >
      {isCatalogo ? (
        <CatalogoTable rows={rows} onAction={onAction} />
      ) : (
        <MovTable
          rows={movimientos}
          pie={<PieMovimientos total={movimientos.length} exp={exp} />}
        />
      )}
    </ScreenBody>
  );
}

/** One open dialog per row action; the screen only routes the click. */
function useRowDialogs() {
  const [open, setOpen] = useState<{ action: RowAction; producto: Producto } | null>(null);
  const close = () => setOpen(null);
  const target = (a: RowAction) => (open?.action === a ? open.producto : null);
  const dialogs = (
    <>
      <EditarProductoSheet producto={target('editar')} onClose={close} />
      <MovimientoDialog producto={target('movimiento')} onClose={close} />
      <ArchivarDialog producto={target('archivar')} onClose={close} />
    </>
  );
  return {
    onAction: (producto: Producto, action: RowAction) => setOpen({ action, producto }),
    dialogs,
  };
}

/** Tab + filter state and the rows they produce; `?filtro=bajo` preselects «Stock bajo». */
function useCatalogo(data: ProductosData | null, filtroInicial: 'todos' | 'bajo') {
  const [tab, setTab] = useState('catalogo');
  const [filter, setFilter] = useState(filtroInicial === 'bajo' ? 'Stock bajo' : 'Todos');
  const catalogo = data?.catalogo ?? [];
  const rows = useMemo(
    () => (filter === 'Stock bajo' ? catalogo.filter(isLow) : catalogo),
    [catalogo, filter],
  );
  // One export behind the header button and «Exportar todos» (DS-02, DS-04).
  const exp = useExportar('movimientos');
  return { tab, setTab, filter, setFilter, catalogo, rows, isCatalogo: tab === 'catalogo', exp };
}

type Catalogo = ReturnType<typeof useCatalogo>;

export function ProductosScreen({
  data,
  filtroInicial = 'todos',
}: {
  readonly data: ProductosData | null;
  /** `?filtro=bajo` — the Inicio banner and the sidebar chip land here. */
  readonly filtroInicial?: 'todos' | 'bajo';
}) {
  const session = useSession();
  const c = useCatalogo(data, filtroInicial);
  const mayWrite = canWrite(session.role);
  const rowDialogs = useRowDialogs();
  const movimientos = data?.movimientos ?? [];

  return (
    <>
      <Heading mayWrite={mayWrite} />
      <Controls c={c} movimientos={movimientos} />
      <Body
        isCatalogo={c.isCatalogo}
        rows={c.rows}
        movimientos={movimientos}
        error={data === null}
        onAction={mayWrite ? rowDialogs.onAction : null}
        exp={c.exp}
      />
      {rowDialogs.dialogs}
    </>
  );
}
