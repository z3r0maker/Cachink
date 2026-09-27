'use client';

import * as Dialog from '@radix-ui/react-dialog';
import Link from 'next/link';
import { formatMoney } from '@xangarro/domain';
import type { ReactNode } from 'react';

import { OPERADOR_BASE } from '../../shell/nav';
import { DialogoCerrar } from '../../ui/dialogo-mostrador';
import * as m from '../../ui/mostrador.css';
import { ESTADO_ENVIO, estadoDe, subtitulo, totalDe } from './copy';
import * as d from './detalle.css';
import { Fichas, Hecho, Notas } from './side';
import * as s from './side.css';
import { Lineas } from './ticket-card';
import type { CargaTicket, VentaDetalle } from './types';

const WHATSAPP =
  'M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719';

export interface CajonProps {
  readonly open: boolean;
  readonly folio: string;
  readonly carga: CargaTicket;
  readonly ctx: { readonly operador: string; readonly caja: string; readonly desde: string };
  /** What a cancellation made on this screen just did. */
  readonly aviso: string | null;
  /** False until the turno's list has this sale (a linked register still loading it). */
  readonly cancelable: boolean;
  readonly onClose: () => void;
  readonly onCompartir: () => void;
  readonly onCancelar: () => void;
}

/**
 * The ticket's side panel over Ventas (OpVentas): folio and state, the total
 * big, what it carried, four tiles, and «Mandar comprobante» / «Cancelar venta».
 * Radix gives the focus trap, Esc and the scrim click.
 */
export function DetalleCajon(p: CajonProps) {
  return (
    <Dialog.Root open={p.open} onOpenChange={(o) => (o ? undefined : p.onClose())}>
      <Dialog.Portal>
        <Dialog.Overlay className={d.overlay} />
        <Dialog.Content className={d.panel} aria-describedby={undefined}>
          {p.carga.state === 'happy' ? (
            <Ticket {...p} venta={p.carga.venta} />
          ) : (
            <SinTicket folio={p.folio} state={p.carga.state} />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Ticket(p: CajonProps & { readonly venta: VentaDetalle }) {
  const { venta } = p;
  const estado = ESTADO_ENVIO[estadoDe(venta)];
  return (
    <>
      <Cabeza folio={venta.folio} pill={<Pill {...estado} />}>
        <Dialog.Title className={d.monto} data-cancelada={venta.cancelada ? '' : undefined}>
          {formatMoney(totalDe(venta))}
        </Dialog.Title>
        <span className={d.sub}>{subtitulo(venta)}</span>
      </Cabeza>
      <div className={d.body}>
        {p.aviso ? <Hecho texto={p.aviso} /> : null}
        <Lineas lineas={venta.lineas} />
        <Fichas venta={venta} ctx={p.ctx} />
        <Notas venta={venta} />
      </div>
      <Pie {...p} cancelada={venta.cancelada !== undefined} />
    </>
  );
}

/** Mandar comprobante and Cancelar venta; once cancelled, only «Listo». */
function Pie(p: CajonProps & { readonly cancelada: boolean }) {
  return (
    <div className={d.foot}>
      {p.cancelada ? (
        <Dialog.Close className={`${m.boton.secundario} ${d.crece}`}>Listo</Dialog.Close>
      ) : (
        <>
          <button
            type="button"
            className={`${m.boton.primario} ${d.crece}`}
            onClick={p.onCompartir}
          >
            <WhatsApp />
            Mandar comprobante
          </button>
          <button
            type="button"
            className={m.boton.peligro}
            disabled={!p.cancelable}
            onClick={p.onCancelar}
          >
            Cancelar venta
          </button>
        </>
      )}
    </div>
  );
}

function Cabeza(p: {
  readonly folio: string;
  readonly pill?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className={d.head}>
      <div className={d.headTop}>
        <span className={m.eyebrow}>Venta · {p.folio}</span>
        {p.pill}
        <span className={d.cerrar}>
          <DialogoCerrar label="Cerrar" />
        </span>
      </div>
      {p.children}
    </div>
  );
}

function Pill(p: { readonly texto: string; readonly bg: string; readonly fg: string }) {
  return (
    <span className={d.pill} style={{ background: p.bg, color: p.fg, border: `2px solid ${p.fg}` }}>
      <span className={d.dot} style={{ background: p.fg }} />
      {p.texto}
    </span>
  );
}

const SIN: Readonly<Record<'loading' | 'empty' | 'error', readonly [string, string]>> = {
  loading: ['Cargando el ticket…', 'Un momento, lo estamos leyendo de la caja.'],
  empty: [
    'Esta venta ya no existe',
    'Puede que se haya cancelado desde otra caja. Vuelve a la lista de ventas de tu turno.',
  ],
  error: ['No pudimos cargar el ticket', 'Cierra y vuelve a abrir la venta en un momento.'],
};

/** Loading, gone, or unreadable: said in the drawer, with the way back. */
function SinTicket(p: { readonly folio: string; readonly state: 'loading' | 'empty' | 'error' }) {
  const [titulo, texto] = SIN[p.state];
  return (
    <>
      <Cabeza folio={p.folio}>
        <Dialog.Title className={d.titulo}>{titulo}</Dialog.Title>
      </Cabeza>
      <div className={d.body}>
        <div className={s.estado} role={p.state === 'loading' ? 'status' : undefined}>
          {texto}
          {p.state === 'empty' ? (
            <Link href={`${OPERADOR_BASE}/ventas`} className={s.enlace}>
              Ver mis ventas
            </Link>
          ) : null}
        </div>
      </div>
    </>
  );
}

function WhatsApp() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={WHATSAPP} />
    </svg>
  );
}
