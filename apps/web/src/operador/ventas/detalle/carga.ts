'use client';

/**
 * The drawer's ticket (O-34 behind the Ventas drawer): a linked register
 * reads the turno's ticket by folio from its own database; an unlinked
 * browser keeps the design fixtures, and the route's forced state wins.
 */

import { useEffect, useState } from 'react';

import { categoriaDe } from '../../caja/viva';
import { hoyLocal } from '../../cobranza/vivo';
import { registerRuntime } from '../../runtime/client';
import type { TicketPara } from '../../runtime/protocol';
import type { Credenciales } from '../../runtime/use-credenciales';
import { comoMetodo } from '../derive';
import type { VentaTurno } from '../types';
import { detalleDeFila, ventaPorFolio } from './fixture';
import type { Abierta, CargaTicket, VentaDetalle } from './types';

/** «Hoy 14:52», or the date when the ticket is from another day. */
function cuando(fecha: string, hora: string): string {
  if (fecha === hoyLocal()) return `Hoy ${hora}`;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(
    new Date(`${fecha}T12:00:00`),
  );
}

function comoVenta(t: TicketPara, capturo: string): VentaDetalle {
  return {
    id: t.id,
    folio: `V-${String(t.folio).padStart(4, '0')}`,
    cuando: cuando(t.fecha, t.hora),
    metodo: comoMetodo(t.metodo),
    capturo,
    lineas: t.lineas.map((l) => ({
      productoId: l.productoId,
      nombre: l.nombre,
      precio: BigInt(l.precioCentavos),
      cantidad: l.cantidad,
      categoria: categoriaDe(l.categoria),
    })),
    ...(t.recibidoCentavos === null ? {} : { recibido: BigInt(t.recibidoCentavos) }),
    ...(t.cliente === null
      ? {}
      : {
          fiado: {
            cliente: t.cliente,
            ...(t.clienteSaldoCentavos === null ? {} : { saldo: BigInt(t.clienteSaldoCentavos) }),
          },
        }),
    ...(t.cancelada === null ? {} : { cancelada: { motivo: t.cancelada } }),
  };
}

/** Read the turno's ticket by folio from the register's own database. */
async function leerTicket(cred: Credenciales, folio: string): Promise<CargaTicket> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const n = Number.parseInt(folio.replace(/^V-/, ''), 10);
  const r = await registerRuntime().ticket(device.businessId, device.deviceId, n);
  return r.ticket === null
    ? { state: 'empty' }
    : { state: 'happy', venta: comoVenta(r.ticket, r.capturo) };
}

/** The fixture path: the route's choice, the priced ticket, or the list's row. */
export function ticketDeFixture(
  folio: string,
  fila: VentaTurno | undefined,
  abierta: Abierta | undefined,
): CargaTicket {
  const elegida = abierta?.folio === folio ? abierta.venta : undefined;
  if (elegida === null) return { state: 'empty' };
  const base = elegida ?? ventaPorFolio(folio) ?? (fila ? detalleDeFila(fila) : null);
  if (base === null) return { state: 'empty' };
  // A cancellation made on this screen shows on the ticket too.
  return { state: 'happy', venta: fila?.cancelada ? { ...base, cancelada: fila.cancelada } : base };
}

/** The drawer's ticket for `folio`, reloaded when its row is cancelled. */
export function useTicket(p: {
  readonly folio: string | null;
  readonly fila: VentaTurno | undefined;
  readonly abierta: Abierta | undefined;
  readonly cred: Credenciales;
  readonly linked: boolean;
}): CargaTicket {
  const { folio, cred, linked } = p;
  const marca = p.fila?.cancelada?.motivo ?? '';
  const [vivo, setVivo] = useState<CargaTicket>({ state: 'loading' });
  useEffect(() => {
    if (!linked || folio === null) return;
    setVivo({ state: 'loading' });
    leerTicket(cred, folio)
      .then(setVivo)
      .catch(() => setVivo({ state: 'error' }));
  }, [cred, linked, folio, marca]);
  const forzado = p.abierta?.folio === folio ? p.abierta?.state : undefined;
  if (forzado !== undefined && forzado !== 'happy') return { state: forzado };
  if (folio === null) return { state: 'empty' };
  return linked ? vivo : ticketDeFixture(folio, p.fila, p.abierta);
}
