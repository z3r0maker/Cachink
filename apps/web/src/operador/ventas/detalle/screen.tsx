'use client';

import { useState } from 'react';

import { total as totalDe } from '../../caja/ticket';
import { Share } from '../../caja/share';
import { OperadorEstado } from '../../estado';
import * as h from '../../shell/header.css';
import { OPERADOR_BASE } from '../../shell/nav';
import { HeaderAction } from '../../shell/shell';
import { OpMain } from '../../ui/parts';
import { CancelarVenta } from '../cancelar';
import { cancelAviso, cancelIntro, ESTADO_ENVIO, type EstadoEnvio } from './copy';
import * as d from './detalle.css';
import { Acciones, FiadoCard, Traza } from './side';
import * as s from './side.css';
import { TicketCard } from './ticket-card';
import type { DetalleData, DetalleScreenProps, VentaDetalle } from './types';

/** The file's receipt glyph for the empty and error tiles. */
const RECIBO = 'M5 3h14v18l-3-2-2 2-2-2-2 2-3-2V3M9 8h6M9 12h6';

/** Operador · Detalle de venta: the full ticket, who captured it, and what can still be done. */
export function DetalleScreen({ state, data }: DetalleScreenProps) {
  const venta = data.venta;
  return (
    <OpMain top={24} narrow>
      {state === 'happy' && venta ? (
        <Detalle key={`${venta.folio}${venta.cancelada ? 'x' : ''}`} data={data} venta={venta} />
      ) : (
        <OperadorEstado
          mode={state === 'happy' ? 'empty' : state}
          icon={RECIBO}
          emptyTitle="Esta venta ya no existe"
          emptyBody="Puede que se haya cancelado desde otra caja. Vuelve a la lista de ventas de tu turno."
          errorTitle="No pudimos cargar el ticket"
          cta="Ver mis ventas"
          href={`${OPERADOR_BASE}/ventas`}
        />
      )}
    </OpMain>
  );
}

/** Cancelling is device-local until the use case is wired (O-06), as on Ventas. */
function Detalle({ data, venta }: { readonly data: DetalleData; readonly venta: VentaDetalle }) {
  const [motivo, setMotivo] = useState<string | null>(venta.cancelada?.motivo ?? null);
  const [modal, setModal] = useState<'cancel' | 'share' | null>(null);
  const total = totalDe(venta.lineas);
  const close = () => setModal(null);
  const envio: EstadoEnvio = motivo !== null ? 'cancelada' : venta.enCola ? 'en-cola' : 'enviada';
  return (
    <>
      <EstadoPill envio={envio} />
      <div className={d.grid}>
        <TicketCard venta={venta} total={total} cancelada={motivo} />
        <div className={s.column}>
          <Traza data={data} envio={envio} />
          <Acciones
            venta={venta}
            cancelada={motivo !== null}
            onShare={() => setModal('share')}
            onCancel={() => setModal('cancel')}
          />
          {venta.fiado ? <FiadoCard fiado={venta.fiado} /> : null}
        </div>
      </div>
      {modal === 'cancel' ? (
        <Cancelar venta={venta} total={total} onClose={close} onConfirm={setMotivo} />
      ) : null}
      <Share
        variant="detalle"
        comprobante={modal === 'share' ? comprobante(data, venta, total) : null}
        onClose={close}
      />
    </>
  );
}

/** Confirming records the reason and closes the modal. */
function Cancelar(p: {
  readonly venta: VentaDetalle;
  readonly total: bigint;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: string) => void;
}) {
  return (
    <CancelarVenta
      titulo={`Cancelar ${p.venta.folio}`}
      intro={<div className={s.intro}>{cancelIntro(p.venta, p.total)}</div>}
      aviso={cancelAviso(p.venta)}
      onClose={p.onClose}
      onConfirm={(m) => {
        p.onConfirm(m);
        p.onClose();
      }}
    />
  );
}

function comprobante(data: DetalleData, v: VentaDetalle, total: bigint) {
  const cambio = v.recibido === undefined ? null : v.recibido - total;
  return {
    negocio: data.negocio,
    folio: v.folio,
    venta: { lines: v.lineas, total, metodo: v.metodo, cambio, nota: '' },
  };
}

/** The header's right side on this screen: the sale's state instead of the sync pill. */
function EstadoPill({ envio }: { readonly envio: EstadoEnvio }) {
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
