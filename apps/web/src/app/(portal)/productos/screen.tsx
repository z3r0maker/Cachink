'use client';

import { useMemo, useState } from 'react';

import { ScreenBody, SegmentedTabs } from '@/components';
import { useSession } from '@/session/provider';
import type { ProductosData } from '@/server/screens';
import { canWrite, resolveScreenState } from '@/session/gating';

import type { OnRowAction, RowAction } from './columns';
import { ArchivarDialog } from './archivar-dialog';
import { MovimientoDialog } from './movimiento-dialog';
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

function Tabs({
  tab,
  onChange,
  catalogCount,
  movCount,
}: {
  readonly tab: string;
  readonly onChange: (v: string) => void;
  readonly catalogCount: number;
  readonly movCount: number;
}) {
  return (
    <SegmentedTabs
      ariaLabel="Productos"
      value={tab}
      onValueChange={onChange}
      tabs={[
        { value: 'catalogo', label: 'Catálogo', count: catalogCount },
        { value: 'movimientos', label: 'Movimientos', count: movCount },
      ]}
    />
  );
}

function Controls({
  tab,
  setTab,
  filter,
  setFilter,
  catalogo,
  movimientos,
  movCount,
  isCatalogo,
  low,
}: {
  readonly tab: string;
  readonly setTab: (v: string) => void;
  readonly filter: string;
  readonly setFilter: (v: string) => void;
  readonly catalogo: readonly Producto[];
  readonly movimientos: readonly Movimiento[];
  readonly movCount: number;
  readonly isCatalogo: boolean;
  readonly low: number;
}) {
  // Switching tabs resets the filter: the keys are not shared.
  const onTab = (v: string) => {
    setTab(v);
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
      <Tabs tab={tab} onChange={onTab} catalogCount={catalogo.length} movCount={movCount} />
      {isCatalogo ? <Kpis rows={catalogo} /> : <KpisMovimientos rows={movimientos} />}
      {isCatalogo ? <Chips filter={filter} setFilter={setFilter} /> : null}
    </>
  );
}

function Body({
  isCatalogo,
  rows,
  movimientos,
  error,
  onAction,
}: {
  readonly isCatalogo: boolean;
  readonly rows: readonly Producto[];
  readonly movimientos: readonly Movimiento[];
  readonly error: boolean;
  readonly onAction: OnRowAction;
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
        <MovTable rows={movimientos} />
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
  return { tab, setTab, filter, setFilter, catalogo, rows, isCatalogo: tab === 'catalogo' };
}

export function ProductosScreen({
  data,
  filtroInicial = 'todos',
}: {
  readonly data: ProductosData | null;
  /** `?filtro=bajo` — the Inicio banner and the sidebar chip land here. */
  readonly filtroInicial?: 'todos' | 'bajo';
}) {
  const session = useSession();
  const { tab, setTab, filter, setFilter, catalogo, rows, isCatalogo } = useCatalogo(
    data,
    filtroInicial,
  );
  const mayWrite = canWrite(session.role);
  const rowDialogs = useRowDialogs();

  return (
    <>
      <Heading mayWrite={mayWrite} />
      <Controls
        tab={tab}
        setTab={setTab}
        filter={filter}
        setFilter={setFilter}
        catalogo={catalogo}
        movimientos={data?.movimientos ?? []}
        movCount={data?.movimientos.length ?? 0}
        isCatalogo={isCatalogo}
        low={catalogo.filter(isLow).length}
      />
      <Body
        isCatalogo={isCatalogo}
        rows={rows}
        movimientos={data?.movimientos ?? []}
        error={data === null}
        onAction={mayWrite ? rowDialogs.onAction : null}
      />
      {rowDialogs.dialogs}
    </>
  );
}
