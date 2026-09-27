'use client';

import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import { Share } from '../caja/share';
import { OperadorEstado } from '../estado';
import { NuevaVenta } from '../shell/actions';
import { ICONS, OPERADOR_BASE } from '../shell/nav';
import * as m from '../ui/mostrador.css';
import { OpMain } from '../ui/parts';
import * as t from '../ui/title.css';
import { CancelarVenta } from './cancelar';
import { filtrar, resumen } from './derive';
import { comprobante } from './detalle/acciones';
import { useTicket } from './detalle/carga';
import { DetalleCajon } from './detalle/screen';
import { ListaVentas } from './lista';
import { FILTROS } from './metodo';
import * as p from './pantalla.css';
import { useVentas } from './use-ventas';
import type { VentasScreenProps } from './types';
import type { VentaDetalle } from './detalle/types';

/** The fixture's business, until the register knows its own name (O-38). */
const NEGOCIO = 'Taquería Don Pedro';
const SEARCH = 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM21 21l-4.34-4.34';

type Ventas = ReturnType<typeof useVentas>;

/** Operador · Ventas (OpVentas): the turno's sales; each opens its ticket in a side panel. */
export function VentasScreen({ state, data, filtro, abierta }: VentasScreenProps) {
  const v = useVentas(data, filtro, abierta);
  const vivo = v.state === 'happy' ? state : v.state;
  return (
    <OpMain top={24}>
      <NuevaVenta />
      <div className={t.titleRow}>
        <h1 className={t.pageTitle}>Ventas del turno</h1>
        <span className={t.pageSub}>Lo que cobraste desde las {v.data.desde}</span>
      </div>
      <Resumen v={v} />
      <Filtros v={v} />
      {vivo === 'happy' ? (
        <ListaVentas
          ventas={filtrar(v.data.ventas, v.filtro, v.query)}
          seleccionada={v.capa === null ? null : v.sel}
          onAbrir={v.abrir}
        />
      ) : (
        <OperadorEstado
          mode={vivo}
          icon={ICONS.ventas}
          emptyTitle="Sin ventas en este turno"
          emptyBody="Cuando cobres la primera, aparece aquí con su folio y cómo te pagaron."
          errorTitle="No pudimos cargar tus ventas"
          cta="Ir a cobrar"
          href={`${OPERADOR_BASE}/caja`}
        />
      )}
      <Capas v={v} abierta={abierta} />
    </OpMain>
  );
}

function Resumen({ v }: { readonly v: Ventas }) {
  const r = resumen(v.data.ventas);
  const cifras: readonly [string, string, string?][] = [
    ['Ventas', String(r.activas)],
    ['Cobrado', formatMoney(r.cobrado)],
    ['En efectivo', formatMoney(r.efectivo), colors.greenText],
    ['Canceladas', String(r.canceladas)],
  ];
  return (
    <section aria-label="Resumen del turno" className={p.resumen}>
      {cifras.map(([k, valor, color]) => (
        <div key={k} className={p.cifra}>
          <span className={p.cifraK}>{k}</span>
          <span className={p.cifraV} style={color ? { color } : undefined}>
            {valor}
          </span>
        </div>
      ))}
    </section>
  );
}

function Filtros({ v }: { readonly v: Ventas }) {
  return (
    <div className={p.filtros}>
      <label className={`${m.campo} ${p.buscar}`}>
        <span style={{ color: colors.gray600, display: 'grid' }}>
          <Icon path={SEARCH} size={18} strokeWidth={2} />
        </span>
        <input
          type="search"
          aria-label="Buscar venta"
          placeholder="Busca por folio, producto o cliente"
          className={m.campoInput}
          value={v.query}
          onChange={(e) => v.setQuery(e.target.value)}
        />
      </label>
      <div role="radiogroup" aria-label="Cómo pagaron" className={p.chips}>
        {FILTROS.map((f) => (
          <button
            key={f.valor}
            type="button"
            role="radio"
            aria-checked={v.filtro === f.valor}
            className={m.chip}
            onClick={() => v.setFiltro(f.valor)}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** The drawer, and the two dialogs it opens (each replaces it while open). */
function Capas({
  v,
  abierta,
}: {
  readonly v: Ventas;
  readonly abierta: VentasScreenProps['abierta'];
}) {
  const carga = useTicket({ folio: v.sel, fila: v.fila, abierta, cred: v.cred, linked: v.linked });
  if (v.sel === null) return null;
  const ctx = { operador: v.data.operador, caja: v.data.caja, desde: v.data.desde };
  const venta = carga.state === 'happy' ? carga.venta : null;
  const volver = () => v.setCapa('cajon');
  return (
    <>
      <DetalleCajon
        open={v.capa === 'cajon'}
        folio={v.sel}
        carga={carga}
        ctx={ctx}
        aviso={v.aviso}
        cancelable={v.fila !== undefined}
        onClose={v.cerrar}
        onCompartir={() => v.setCapa('compartir')}
        onCancelar={() => v.setCapa('cancelar')}
      />
      {v.capa === 'cancelar' && v.fila ? (
        <CancelarVenta venta={v.fila} conNip={v.conNip} onClose={volver} onConfirm={v.cancelar} />
      ) : null}
      <Compartir v={v} venta={v.capa === 'compartir' ? venta : null} onClose={volver} />
    </>
  );
}

/** «Mandar comprobante» for the open ticket (the dialog replaces the drawer). */
function Compartir(p: {
  readonly v: Ventas;
  readonly venta: VentaDetalle | null;
  readonly onClose: () => void;
}) {
  const { data } = p.v;
  const caja = `${data.caja} · ${data.operador.split(' ')[0] ?? ''}`;
  return (
    <Share
      key={p.venta ? 'abierto' : 'cerrado'}
      variant="detalle"
      comprobante={p.venta ? comprobante(data.negocio ?? NEGOCIO, p.venta, caja) : null}
      cliente={p.venta?.fiado?.cliente}
      onClose={p.onClose}
    />
  );
}
