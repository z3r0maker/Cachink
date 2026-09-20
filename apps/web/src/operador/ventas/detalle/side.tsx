import Link from 'next/link';

import * as h from '../../shell/header.css';
import { OPERADOR_BASE } from '../../shell/nav';
import { HeaderAction } from '../../shell/shell';
import * as u from '../../ui/ui.css';
import { cancelHint, ESTADO_ENVIO, fiadoDetalle, type EstadoEnvio } from './copy';
import * as s from './side.css';
import type { DetalleData, VentaDetalle } from './types';

/** «Quién y cuándo»: who captured it, where, in which turno, and whether it reached the portal. */
export function Traza({
  data,
  envio,
}: {
  readonly data: DetalleData;
  readonly envio: EstadoEnvio;
}) {
  const rows: readonly [string, string][] = [
    ['Capturó', data.operador],
    ['Caja', data.caja],
    ['Turno', data.turno],
    ['Enviada al portal', ESTADO_ENVIO[envio].traza],
  ];
  return (
    <div className={u.listCard}>
      <div className={`${u.eyebrow} ${s.cardHead}`}>Quién y cuándo</div>
      <div className={s.cardBody}>
        {rows.map(([label, value]) => (
          <div key={label} className={s.traza}>
            <span className={s.trazaLabel}>{label}</span>
            <span className={s.trazaValue}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** «Qué puedes hacer»: share the receipt; cancel, until it is cancelled. */
export function Acciones(p: {
  readonly venta: VentaDetalle;
  readonly cancelada: boolean;
  readonly onShare: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <div className={u.listCard}>
      <div className={`${u.eyebrow} ${s.cardHead}`}>Qué puedes hacer</div>
      <div className={s.cardBody}>
        <button type="button" className={s.share} data-onyellow="" onClick={p.onShare}>
          Compartir comprobante
        </button>
        <button type="button" className={s.cancel} disabled={p.cancelada} onClick={p.onCancel}>
          Cancelar venta
        </button>
        <div className={s.hint}>{cancelHint(p.venta, p.cancelada)}</div>
      </div>
    </div>
  );
}

/** The amber card of a fiado sale: the client, the balance it left, and a way to collect. */
export function FiadoCard({ fiado }: { readonly fiado: NonNullable<VentaDetalle['fiado']> }) {
  return (
    <div className={s.fiado}>
      <div className={u.eyebrow}>Esta venta quedó fiada</div>
      <div className={s.cliente}>{fiado.cliente}</div>
      <div className={s.fiadoText}>{fiadoDetalle(fiado.saldo)}</div>
      <Link href={`${OPERADOR_BASE}/cobranza`} className={s.abono}>
        Recibir un abono
      </Link>
    </div>
  );
}

/** The header's right side on this screen: the sale's state instead of the sync pill. */
export function EstadoPill({ envio }: { readonly envio: EstadoEnvio }) {
  const e = ESTADO_ENVIO[envio];
  return (
    <HeaderAction>
      <span className={h.syncStatic} style={{ background: e.bg }}>
        <span className={h.syncDot} style={{ background: e.dot }} />
        <span className={h.syncLabel}>{e.pill}</span>
      </span>
    </HeaderAction>
  );
}
