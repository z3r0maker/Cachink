'use client';

import { useState } from 'react';

import { total as totalDe } from '../../caja/ticket';
import { Share } from '../../caja/share';
import { OperadorEstado } from '../../estado';
import { OPERADOR_BASE } from '../../shell/nav';
import { OpMain } from '../../ui/parts';
import { CancelarVenta } from '../cancelar';
import { cancelarEnVivo, comprobante } from './acciones';
import { cancelAviso, cancelIntro, type EstadoEnvio } from './copy';
import * as d from './detalle.css';
import { Acciones, EstadoPill, FiadoCard, Traza } from './side';
import * as s from './side.css';
import { TicketCard } from './ticket-card';
import type { DetalleData, DetalleScreenProps, VentaDetalle } from './types';

/** The file's receipt glyph for the empty and error tiles. */
const RECIBO = 'M5 3h14v18l-3-2-2 2-2-2-2 2-3-2V3M9 8h6M9 12h6';

/** Operador · Detalle de venta: the full ticket, who captured it, and what can still be done. */
export function DetalleScreen({ state, data, recargar }: DetalleScreenProps) {
  const venta = data.venta;
  return (
    <OpMain top={24} narrow>
      {state === 'happy' && venta ? (
        <Detalle
          key={`${venta.folio}${venta.cancelada ? 'x' : ''}`}
          data={data}
          venta={venta}
          recargar={recargar}
        />
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

/** On a linked register the cancel goes through the use case (O-34), NIP included. */
function Detalle({
  data,
  venta,
  recargar,
}: {
  readonly data: DetalleData;
  readonly venta: VentaDetalle;
  readonly recargar?: () => void;
}) {
  const [motivo, setMotivo] = useState<string | null>(venta.cancelada?.motivo ?? null);
  const [modal, setModal] = useState<'cancel' | 'share' | null>(null);
  const total = totalDe(venta.lineas);
  const close = () => setModal(null);
  const envio: EstadoEnvio = motivo !== null ? 'cancelada' : venta.enCola ? 'en-cola' : 'enviada';
  const confirmar = (motivo: string, nip: string, nota: string) =>
    alConfirmar({ venta, data, recargar, setMotivo, motivo, nip, nota });
  return (
    <>
      <EstadoPill envio={envio} />
      <Cuerpo
        data={data}
        venta={venta}
        total={total}
        motivo={motivo}
        envio={envio}
        onShare={() => setModal('share')}
        onCancel={() => setModal('cancel')}
      />
      <Capas
        data={data}
        venta={venta}
        total={total}
        modal={modal}
        close={close}
        confirmar={confirmar}
      />
    </>
  );
}

/** Record the reason — and on a linked register, write it through the use case. */
function alConfirmar(p: {
  readonly venta: VentaDetalle;
  readonly data: DetalleData;
  readonly recargar?: () => void;
  readonly setMotivo: (m: string) => void;
  readonly motivo: string;
  readonly nip: string;
  readonly nota: string;
}): void {
  const completo = p.nota === '' ? p.motivo : `${p.motivo} — ${p.nota}`;
  p.setMotivo(completo);
  if (p.data.vinculado === true && p.venta.id !== undefined) {
    void cancelarEnVivo(p.venta.id, completo, p.nip).then(() => p.recargar?.());
  }
}

/** The ticket card beside its two side cards. */
function Cuerpo(p: {
  readonly data: DetalleData;
  readonly venta: VentaDetalle;
  readonly total: bigint;
  readonly motivo: string | null;
  readonly envio: EstadoEnvio;
  readonly onShare: () => void;
  readonly onCancel: () => void;
}) {
  return (
    <div className={d.grid}>
      <TicketCard venta={p.venta} total={p.total} cancelada={p.motivo} />
      <div className={s.column}>
        <Traza data={p.data} envio={p.envio} />
        <Acciones
          venta={p.venta}
          cancelada={p.motivo !== null}
          onShare={p.onShare}
          onCancel={p.onCancel}
        />
        {p.venta.fiado ? <FiadoCard fiado={p.venta.fiado} /> : null}
      </div>
    </div>
  );
}

/** The modal layer: cancel (with its NIP on a linked register) and share. */
function Capas(p: {
  readonly data: DetalleData;
  readonly venta: VentaDetalle;
  readonly total: bigint;
  readonly modal: 'cancel' | 'share' | null;
  readonly close: () => void;
  readonly confirmar: (motivo: string, nip: string, nota: string) => void;
}) {
  return (
    <>
      {p.modal === 'cancel' ? (
        <Cancelar
          venta={p.venta}
          total={p.total}
          conNip={p.data.vinculado === true}
          onClose={p.close}
          onConfirm={p.confirmar}
        />
      ) : null}
      <Share
        variant="detalle"
        comprobante={p.modal === 'share' ? comprobante(p.data, p.venta, p.total) : null}
        onClose={p.close}
      />
    </>
  );
}

/** Confirming records the reason and closes the modal. */
function Cancelar(p: {
  readonly venta: VentaDetalle;
  readonly total: bigint;
  readonly conNip: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (motivo: string, nip: string, nota: string) => void;
}) {
  return (
    <CancelarVenta
      titulo={`Cancelar ${p.venta.folio}`}
      intro={<div className={s.intro}>{cancelIntro(p.venta, p.total)}</div>}
      aviso={cancelAviso(p.venta)}
      conNip={p.conNip}
      onClose={p.onClose}
      onConfirm={(m, nip, nota) => {
        p.onConfirm(m, nip, nota);
        p.onClose();
      }}
    />
  );
}
