'use client';

import { useState } from 'react';
import { comoMetodo, type VentaTurno } from '@xangarro/caja/ventas';

import { useCredenciales } from '../runtime/use-credenciales';
import { CancelarVenta } from '../ventas/cancelar';
import type { Motivo } from '../ventas/cancelar-campos';
import { cancelarVinculada } from '../ventas/cancelar-vivo';
import { reemplazar } from './ticket-store';
import { VENTA_REGISTRADA } from './turno-de-caja';
import type { Caja } from './use-caja';
import type { VentaHecha } from './use-sale-toast';

/**
 * «Deshacer» on the card after a sale cancels that sale (owner decision,
 * 2026-11-21). It opens Ventas' own «Cancelar venta» for it, on «Me equivoqué
 * al cobrar», and cancels through the same use case: NIP, the operator's
 * permission, the cancellation log. Only a cancel that goes through gives the
 * lines back to the ticket. A sale with no ticket to cancel (the design's
 * unlinked caja, or one the register could not record) just gives them back.
 */
const MOTIVO: Motivo = 'Me equivoqué al cobrar';

export function useDeshacer(caja: Caja) {
  const [venta, setVenta] = useState<VentaHecha | null>(null);
  const abrir = (): void => {
    const v = caja.toast.venta;
    if (v?.ticketId === undefined || v.folio === undefined) {
      caja.deshacer();
      return;
    }
    // The dialog holds the sale itself: the card may fade meanwhile.
    setVenta(v);
    caja.toast.dismiss();
  };
  return { venta, abrir, cerrar: () => setVenta(null) };
}

/** The sale on the card as Ventas lists it. */
function comoFila(
  v: VentaHecha & { readonly ticketId: string; readonly folio: string },
): VentaTurno {
  return {
    id: v.ticketId,
    folio: v.folio,
    concepto: v.lines.map((l) => l.nombre).join(' · '),
    monto: v.total,
    metodo: comoMetodo(v.metodo),
    hora: '',
  };
}

export function DeshacerVenta(p: {
  readonly venta: VentaHecha | null;
  readonly onClose: () => void;
}) {
  const cred = useCredenciales();
  const { venta } = p;
  if (venta === null || venta.ticketId === undefined || venta.folio === undefined) return null;
  const fila = comoFila({ ...venta, ticketId: venta.ticketId, folio: venta.folio });
  const confirmar = async (motivo: Motivo, nip: string, nota: string): Promise<string | null> => {
    const r = await cancelarVinculada(cred, fila, { motivo, nip, nota });
    if ('error' in r) return r.error;
    reemplazar(venta.lines);
    dispatchEvent(new Event(VENTA_REGISTRADA));
    p.onClose();
    return null;
  };
  return (
    <CancelarVenta
      venta={fila}
      conNip
      motivoInicial={MOTIVO}
      onClose={p.onClose}
      onConfirm={confirmar}
    />
  );
}
