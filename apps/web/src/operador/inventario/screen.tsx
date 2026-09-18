'use client';

import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { SearchBox } from '../ui/filters';
import * as fc from '../ui/filters.css';
import { Note } from '../ui/note';
import { KpiRow, OpMain } from '../ui/parts';
import { SegTabs } from '../ui/tabs';
import * as t from '../ui/title.css';
import { Toast } from '../ui/toast';
import { buscar, enLista, resumen } from './derive';
import * as s from './inventario.css';
import { DOWN, ListaExistencias, ListaMovimientos, UP } from './listas';
import { MoverExistencia } from './mover';
import type { InventarioScreenProps } from './types';
import { useInventario, type Inventario } from './use-inventario';

const CAJA_ICON = 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm8-4v20M4 8l8 4 8-4';

/** Operador · Inventario: stock and this turno's entries and write-offs. */
export function InventarioScreen({ state, tab, data }: InventarioScreenProps) {
  const x = useInventario(data, tab);
  return (
    <OpMain top={22}>
      <NuevaVenta />
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Inventario</h1>
        <span className={t.pageSub}>Lo que hay y lo que se movió en tu turno</span>
      </div>
      <Kpis x={x} />
      <Barra x={x} />
      {state === 'happy' ? (
        <Cuerpo x={x} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={CAJA_ICON}
          emptyTitle="Sin productos con existencias"
          emptyBody="Cuando Pedro dé de alta el catálogo con sus existencias, aquí podrás registrar entradas y mermas."
          errorTitle="No pudimos cargar el inventario"
        />
      )}
      <Capas x={x} firma={`${data.operador}, ${data.caja}`} />
    </OpMain>
  );
}

function Kpis({ x }: { readonly x: Inventario }) {
  const r = resumen(x.items, x.movs);
  return (
    <KpiRow
      min={220}
      valueSize={34}
      items={[
        {
          label: 'Por reponer',
          value: String(r.porReponer),
          color: colors.redText,
          hint: 'Están en o abajo de su umbral',
        },
        {
          label: 'Entradas de hoy',
          value: String(r.entradas),
          color: colors.greenText,
          hint: enLista(x.movs, x.items, 'Entrada'),
        },
        {
          label: 'Mermas de hoy',
          value: String(r.mermas),
          color: colors.black,
          hint: enLista(x.movs, x.items, 'Merma'),
        },
      ]}
    />
  );
}

/** Tabs, search, and the two general actions (product chosen in the form). */
function Barra({ x }: { readonly x: Inventario }) {
  return (
    <div className={fc.bar}>
      <SegTabs
        items={[
          ['existencias', 'Existencias', x.items.length],
          ['movimientos', 'Movimientos de mi turno', x.movs.length],
        ]}
        value={x.tab}
        onChange={x.setTab}
        density="inventario"
      />
      <SearchBox
        label="Buscar producto"
        placeholder="Buscar producto"
        value={x.query}
        onChange={x.setQuery}
        minWidth={220}
      />
      <Acciones mover={x.mover} />
    </div>
  );
}

function Acciones({ mover }: { readonly mover: Inventario['mover'] }) {
  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      <button
        type="button"
        className={s.accion}
        style={{ background: colors.greenSoft }}
        onClick={() => mover('Entrada')}
      >
        <Icon path={UP} size={17} strokeWidth={2.4} />
        Entrada de mercancía
      </button>
      <button
        type="button"
        className={s.accion}
        style={{ background: colors.redSoft }}
        onClick={() => mover('Merma')}
      >
        <Icon path={DOWN} size={17} strokeWidth={2.4} />
        Merma
      </button>
    </div>
  );
}

/** The rule stays in view under the stock: free adjustments are the owner's. */
function Cuerpo({ x }: { readonly x: Inventario }) {
  if (x.tab === 'movimientos') return <ListaMovimientos movs={x.movs} items={x.items} />;
  return (
    <>
      <ListaExistencias items={buscar(x.items, x.query)} query={x.query} onMover={x.mover} />
      <Note bg={colors.yellowSoft} padding="14px 16px" textColor={colors.ink}>
        Las ventas descuentan existencias solas. Tú registras entradas y mermas; el ajuste libre de
        existencias lo hace Pedro desde el portal.
      </Note>
    </>
  );
}

function Capas({ x, firma }: { readonly x: Inventario; readonly firma: string }) {
  return (
    <>
      {x.form ? (
        <MoverExistencia
          tipo={x.form.tipo}
          inicial={x.form.inicial}
          items={x.items}
          firma={firma}
          onClose={() => x.setForm(null)}
          onSave={x.registrar}
        />
      ) : null}
      {x.toast ? (
        <Toast
          title={x.toast.tipo === 'Merma' ? 'Merma registrada' : 'Entrada registrada'}
          body={x.toast.body}
          tint={x.toast.tipo === 'Merma' ? colors.redSoft : colors.greenSoft}
          check={colors.black}
          width={360}
          onClose={x.closeToast}
        />
      ) : null}
    </>
  );
}
