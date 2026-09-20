'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import { FilterChips, SearchBox } from '../ui/filters';
import * as fc from '../ui/filters.css';
import { Note } from '../ui/note';
import { KpiRow, OpMain } from '../ui/parts';
import * as t from '../ui/title.css';
import { Toast } from '../ui/toast';
import { CancelarDeLista } from './cancelar';
import { filtrar, resumen } from './derive';
import { ListaVentas } from './lista';
import { useVentas } from './use-ventas';
import type { MetodoVenta, VentaTurno, VentasScreenProps } from './types';

const FILTROS: readonly ('Todos' | MetodoVenta)[] = [
  'Todos',
  'Efectivo',
  'Transferencia',
  'Tarjeta',
  'QR / CoDi',
  'Fiado',
];

/** Operador · Ventas: the turno's sales, searchable, each cancellable with a reason. */
export function VentasScreen({ state, data, filtro: filtroInicial }: VentasScreenProps) {
  const v = useVentas(data, filtroInicial);
  const vivo = v.state === 'happy' ? state : v.state;
  return (
    <OpMain top={22}>
      <NuevaVenta />
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Ventas</h1>
        <span className={t.pageSub}>Lo que cobraste en este turno</span>
      </div>
      <VentasKpis ventas={v.data.ventas} desde={v.data.desde} />
      <Filtros v={v} />
      <Cuerpo state={vivo} v={v} firma={`${v.data.operador} · ${v.data.caja}`} />
      <Note bg={colors.yellowSoft} padding="14px 16px" textColor={colors.ink}>
        Puedes cancelar ventas de este turno con un motivo. La venta no se borra: queda marcada como
        cancelada y Pedro la ve en su portal y en tu corte.
      </Note>
      {v.cancelando ? (
        <CancelarDeLista
          venta={v.cancelando}
          conNip={v.conNip}
          onClose={() => v.setCancelando(null)}
          onConfirm={v.cancelar}
        />
      ) : null}
      {v.toast ? (
        <Toast
          title="Venta cancelada"
          body={v.toast}
          tint={colors.redSoft}
          width={360}
          onClose={v.closeToast}
        />
      ) : null}
    </OpMain>
  );
}

type Ventas = ReturnType<typeof useVentas>;

function VentasKpis({
  ventas,
  desde,
}: {
  readonly ventas: readonly VentaTurno[];
  readonly desde: string;
}) {
  const r = resumen(ventas);
  return (
    <KpiRow
      min={220}
      valueSize={34}
      items={[
        {
          label: 'Ventas del turno',
          value: String(r.activas),
          color: colors.black,
          hint: `Desde las ${desde}`,
        },
        {
          label: 'Cobrado',
          value: formatMoney(r.cobrado),
          color: colors.greenText,
          hint: 'Todos los métodos',
        },
        {
          label: 'En efectivo',
          value: formatMoney(r.efectivo),
          color: colors.black,
          hint: 'Cuenta para tu corte',
        },
      ]}
    />
  );
}

function Filtros({ v }: { readonly v: Ventas }) {
  return (
    <div className={fc.bar}>
      <SearchBox
        label="Buscar venta"
        placeholder="Buscar por folio, producto o cliente"
        value={v.query}
        onChange={v.setQuery}
      />
      <FilterChips options={FILTROS} value={v.filtro} onChange={v.setFiltro} />
    </div>
  );
}

function Cuerpo(p: {
  readonly state: VentasScreenProps['state'];
  readonly v: Ventas;
  readonly firma: string;
}) {
  const { state, v } = p;
  return state === 'happy' ? (
    <ListaVentas
      ventas={filtrar(v.data.ventas, v.filtro, v.query)}
      firma={p.firma}
      onCancel={v.setCancelando}
    />
  ) : (
    <OperadorEstado
      mode={state}
      icon={ICONS.ventas}
      emptyTitle="Sin ventas en este turno"
      emptyBody="Cuando cobres la primera, aparece aquí con su folio, su método y la opción de cancelar."
      errorTitle="No pudimos cargar tus ventas"
      cta="Ir a la caja"
      href={`${OPERADOR_BASE}/caja`}
    />
  );
}
