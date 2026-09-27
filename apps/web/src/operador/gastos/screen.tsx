'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { OperadorEstado } from '../estado';
import { FilterChips, SearchBox } from '../ui/filters';
import * as fc from '../ui/filters.css';
import { PageHead } from '../ui/panel';
import { OpMain } from '../ui/parts';
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
export function GastosScreen({ state, data, registrarVivo }: GastosScreenProps) {
  const x = useGastos(data.gastos, registrarVivo);
  const firma = `${data.operador}, ${data.caja}`;
  return (
    <OpMain top={24}>
      <Cabeza onRegistrar={() => x.setOpen(true)} />
      <Cifras x={x} />
      <Filtros x={x} />
      {state === 'happy' ? (
        <ListaGastos
          gastos={filtrar(x.gastos, x.filtro, x.query)}
          buscando={x.query.trim() !== ''}
        />
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

function Cabeza({ onRegistrar }: { readonly onRegistrar: () => void }) {
  return (
    <div className={g.cabeza}>
      <PageHead title="Gastos" sub="Lo que salió de la caja en tu turno" />
      <button type="button" className={g.registrar} data-onyellow="" onClick={onRegistrar}>
        <Icon path={PLUS} size={18} strokeWidth={2.4} />
        Registrar gasto
      </button>
    </div>
  );
}

function Filtros({ x }: { readonly x: Gastos }) {
  return (
    <div className={fc.bar}>
      <FilterChips options={FILTROS} value={x.filtro} onChange={x.setFiltro} />
      <SearchBox
        label="Buscar gasto"
        placeholder="Buscar por concepto o proveedor"
        value={x.query}
        onChange={x.setQuery}
      />
    </div>
  );
}

/** «Gastos del turno», «Salió de caja», «Sin comprobante»: one quiet strip. */
function Cifras({ x }: { readonly x: Gastos }) {
  const r = resumen(x.gastos);
  return (
    <section aria-label="Resumen de gastos" className={g.cifras}>
      <div className={g.cifra}>
        <span className={g.cifraLabel}>Gastos del turno</span>
        <span className={g.cifraValor}>{r.cuantos}</span>
      </div>
      <div className={g.cifra}>
        <span className={g.cifraLabel}>Salió de caja</span>
        <span className={g.cifraValor} style={{ color: colors.redText }}>
          {formatMoney(r.total)}
        </span>
      </div>
      <div className={g.cifra}>
        <span className={g.cifraLabel}>Sin comprobante</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span className={g.cifraValor} style={{ color: colors.warningText }}>
            {r.sinComprobante}
          </span>
          <span className={g.cifraNota}>Pedro te lo va a preguntar</span>
        </span>
      </div>
    </section>
  );
}

/** The drawer while open, and the confirmation after saving. */
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
