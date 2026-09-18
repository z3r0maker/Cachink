'use client';

import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import { colors } from '@xangarro/tokens';

import { Icon } from '../../shell/icon';
import * as l from '../turno/lists.css';
import { OPERADOR_BASE } from '../shell/nav';
import { SinResultados } from '../ui/filters';
import * as u from '../ui/ui.css';
import type { MetodoVenta, VentaTurno } from './types';
import * as v from './ventas.css';

export const METODO_BG: Record<MetodoVenta, string> = {
  Efectivo: colors.greenSoft,
  Transferencia: colors.blueSoft,
  Tarjeta: colors.purpleSoft,
  'QR / CoDi': colors.peachSoft,
  Fiado: colors.warningSoft,
};

const CHEVRON = 'M9 6l6 6-6 6';
const CLOSE = 'M6 6l12 12M18 6 6 18';

export function ListaVentas(p: {
  readonly ventas: readonly VentaTurno[];
  readonly firma: string;
  readonly onCancel: (v: VentaTurno) => void;
}) {
  return (
    <div className={u.listCard}>
      {p.ventas.map((x) => (
        <Fila key={x.folio} x={x} firma={p.firma} onCancel={() => p.onCancel(x)} />
      ))}
      {p.ventas.length === 0 ? (
        <SinResultados body="Ninguna venta de tu turno coincide con lo que buscas." />
      ) : null}
    </div>
  );
}

/** A cancelled sale stays: struck through, grey, with its chip and no actions. */
function Fila({
  x,
  firma,
  onCancel,
}: {
  readonly x: VentaTurno;
  readonly firma: string;
  readonly onCancel: () => void;
}) {
  const c = x.cancelada;
  const detalle = c ? (x.cliente ?? `Cancelada · ${c.motivo}`) : (x.cliente ?? firma);
  const strike = c ? 'line-through' : 'none';
  return (
    <div className={v.row} data-cancelada={c ? '' : undefined}>
      <span className={v.folio}>{x.folio}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={l.name} style={{ textDecoration: strike }}>
          {x.concepto}
        </div>
        <div className={l.detail}>{detalle}</div>
      </div>
      <span className={v.method} style={{ background: METODO_BG[x.metodo] }}>
        {x.metodo}
      </span>
      <span className={v.time}>{x.hora}</span>
      <div
        className={v.amount}
        style={{ color: c ? colors.gray400 : colors.black, textDecoration: strike }}
      >
        {formatMoney(x.monto)}
      </div>
      <Acciones folio={x.folio} cancelada={!!c} onCancel={onCancel} />
    </div>
  );
}

/** To the ticket, and cancel — or the «Cancelada» chip once it is. */
function Acciones(p: {
  readonly folio: string;
  readonly cancelada: boolean;
  readonly onCancel: () => void;
}) {
  return (
    <>
      <Link href={`${OPERADOR_BASE}/ventas/${p.folio}`} className={v.square} title="Ver el ticket">
        <Icon path={CHEVRON} size={16} strokeWidth={2.5} />
      </Link>
      {p.cancelada ? (
        <span className={v.cancelada}>Cancelada</span>
      ) : (
        <button type="button" className={v.square} title="Cancelar venta" onClick={p.onCancel}>
          <Icon path={CLOSE} size={16} strokeWidth={2.6} />
        </button>
      )}
    </>
  );
}
