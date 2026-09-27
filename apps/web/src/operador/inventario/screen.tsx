'use client';

import { colors } from '@xangarro/tokens';

import { mayuscula } from '../ui/dueno';
import { useDueno } from '../ui/use-dueno';
import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { OpMain } from '../ui/parts';
import { Buscador, Resumenes } from '../ui/resumen';
import * as t from '../ui/title.css';
import { Toast } from '../ui/toast';
import { buscar, enLista, paraReponer, resumen } from './derive';
import * as s from './inventario.css';
import { ListaExistencias, ListaMovimientos } from './listas';
import { MoverExistencia } from './mover';
import type { InventarioScreenProps } from './types';
import { useInventario, type Inventario } from './use-inventario';

const CAJA_ICON = 'M4 8l8-4 8 4v8l-8 4-8-4V8Zm8-4v20M4 8l8 4 8-4';

/** Operador · Inventario: stock, and this turno's deliveries and write-offs. */
export function InventarioScreen({
  state,
  tab,
  data,
  registrarVivo,
  reponer,
}: InventarioScreenProps) {
  const x = useInventario(data, tab, registrarVivo, reponer ?? null);
  const dueno = useDueno();
  return (
    <OpMain top={24}>
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
          emptyBody={`Cuando ${mayuscula(dueno)} dé de alta el catálogo con sus existencias, aquí podrás registrar lo que llega y lo que se echa a perder.`}
          errorTitle="No pudimos cargar el inventario"
        />
      )}
      <Capas x={x} />
    </OpMain>
  );
}

function Kpis({ x }: { readonly x: Inventario }) {
  const r = resumen(x.items, x.movs);
  const nada = (s: string) => s || 'Nada todavía';
  return (
    <Resumenes
      label="Resumen del inventario"
      items={[
        {
          label: 'Por reponer',
          value: String(r.porReponer),
          color: colors.redText,
          hint: paraReponer(x.items),
        },
        {
          label: 'Llegó hoy',
          value: String(r.entradas),
          color: colors.black,
          hint: nada(enLista(x.movs, x.items, 'Entrada')),
        },
        {
          label: 'Mermas de hoy',
          value: String(r.mermas),
          color: colors.black,
          hint: nada(enLista(x.movs, x.items, 'Merma')),
        },
      ]}
    />
  );
}

/** What to see, and the search. The moves start from each product's row. */
function Barra({ x }: { readonly x: Inventario }) {
  return (
    <div className={s.barra}>
      <Pestanas x={x} />
      <Buscador
        label="Buscar producto del inventario"
        placeholder="Busca un producto"
        value={x.query}
        onChange={x.setQuery}
      />
    </div>
  );
}

function Pestanas({ x }: { readonly x: Inventario }) {
  const items = [
    ['existencias', `Existencias · ${x.items.length}`],
    ['movimientos', `Movimientos de mi turno · ${x.movs.length}`],
  ] as const;
  return (
    <div role="tablist" aria-label="Qué ver" className={s.tabs}>
      {items.map(([k, label]) => (
        <button
          key={k}
          type="button"
          role="tab"
          aria-selected={x.tab === k}
          className={s.tab}
          onClick={() => x.setTab(k)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Cuerpo({ x }: { readonly x: Inventario }) {
  const dueno = useDueno();
  if (x.tab === 'movimientos') return <ListaMovimientos movs={x.movs} items={x.items} />;
  return (
    <>
      <ListaExistencias
        items={buscar(x.items, x.query)}
        query={x.query}
        sel={x.form?.id ?? null}
        onMover={x.mover}
      />
      <p className={s.regla}>
        {`Las ventas descuentan existencias solas. Tú registras lo que llega y lo que se echa a perder; el ajuste libre de existencias lo hace ${dueno} desde el portal.`}
      </p>
    </>
  );
}

function Capas({ x }: { readonly x: Inventario }) {
  const item = x.form ? x.items.find((i) => i.id === x.form?.id) : undefined;
  return (
    <>
      {x.form && item ? (
        <MoverExistencia
          key={`${item.id}-${x.form.tipo}`}
          tipo={x.form.tipo}
          item={item}
          enteros={x.enteros}
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
