'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import * as h from '../shell/header.css';
import { HeaderAction } from '../shell/shell';
import { FilterChips, SearchBox } from '../ui/filters';
import * as fc from '../ui/filters.css';
import { KpiRow, OpMain } from '../ui/parts';
import * as t from '../ui/title.css';
import { Toast } from '../ui/toast';
import { filtrar, resumen } from './derive';
import * as g from './gastos.css';
import { ListaGastos } from './lista';
import { RegistrarGasto } from './registrar';
import { CATEGORIAS, type GastosScreenProps } from './types';
import { useGastos, type Gastos } from './use-gastos';

const PLUS = 'M12 5v14M5 12h14';
const FLECHA = 'M12 3v14M6 11l6 6 6-6M4 21h16';
const FILTROS = ['Todos', ...CATEGORIAS] as const;

/** Operador · Gastos: petty cash out of the drawer, each with its category and receipt. */
export function GastosScreen({ state, data }: GastosScreenProps) {
  const x = useGastos(data.gastos);
  const firma = `${data.operador}, ${data.caja}`;
  return (
    <OpMain top={22}>
      <RegistrarBoton onClick={() => x.setOpen(true)} />
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Gastos</h1>
        <span className={t.pageSub}>Lo que salió de la caja en tu turno</span>
      </div>
      <Kpis x={x} desde={data.desde} />
      <Filtros x={x} />
      {state === 'happy' ? (
        <ListaGastos gastos={filtrar(x.gastos, x.filtro, x.query)} />
      ) : (
        <OperadorEstado
          mode={state}
          icon={FLECHA}
          emptyTitle="Sin gastos en este turno"
          emptyBody="Cuando saques dinero de la caja para algo del negocio, regístralo aquí con su comprobante."
          errorTitle="No pudimos cargar tus gastos"
        />
      )}
      <Capas x={x} firma={firma} />
    </OpMain>
  );
}

/** The header's yellow action; a native button, so its 44 px include the border. */
function RegistrarBoton({ onClick }: { readonly onClick: () => void }) {
  return (
    <HeaderAction>
      <button
        type="button"
        className={`${h.action} ${g.headerButton}`}
        data-onyellow=""
        onClick={onClick}
      >
        <Icon path={PLUS} size={17} strokeWidth={2.4} />
        Registrar gasto
      </button>
    </HeaderAction>
  );
}

function Filtros({ x }: { readonly x: Gastos }) {
  return (
    <div className={fc.bar}>
      <SearchBox
        label="Buscar gasto"
        placeholder="Buscar por concepto o proveedor"
        value={x.query}
        onChange={x.setQuery}
      />
      <FilterChips options={FILTROS} value={x.filtro} onChange={x.setFiltro} />
    </div>
  );
}

function Kpis({ x, desde }: { readonly x: Gastos; readonly desde: string }) {
  const r = resumen(x.gastos);
  return (
    <KpiRow
      min={220}
      valueSize={32}
      items={[
        {
          label: 'Gastos del turno',
          value: String(r.cuantos),
          color: colors.black,
          hint: `Desde las ${desde}`,
        },
        {
          label: 'Total salido de caja',
          value: formatMoney(r.total),
          color: colors.redText,
          hint: 'Baja lo esperado en tu corte',
        },
        {
          label: 'Sin comprobante',
          value: String(r.sinComprobante),
          color: colors.warningText,
          hint: 'Pedro te los va a preguntar',
        },
      ]}
    />
  );
}

/** The form while open, and the confirmation after saving. */
function Capas({ x, firma }: { readonly x: Gastos; readonly firma: string }) {
  return (
    <>
      {x.open ? (
        <RegistrarGasto firma={firma} onClose={() => x.setOpen(false)} onSave={x.registrar} />
      ) : null}
      {x.toast ? (
        <Toast
          title="Gasto registrado"
          body={x.toast}
          tint={colors.redSoft}
          width={360}
          onClose={x.closeToast}
        />
      ) : null}
    </>
  );
}
