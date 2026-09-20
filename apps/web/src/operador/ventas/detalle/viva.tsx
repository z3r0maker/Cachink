'use client';

/**
 * Detalle de venta for real (O-34): the open turno's ticket by folio from the
 * register's own database — lines, cash and change, the fiado client, the
 * cancellation through the use case — while an unlinked browser keeps the
 * design fixtures.
 */

import { useCallback, useEffect, useState, type ReactNode } from 'react';

import { categoriaDe } from '../../caja/viva';
import { registerRuntime } from '../../runtime/client';
import { useCredenciales, type Credenciales } from '../../runtime/use-credenciales';
import type { TicketPara } from '../../runtime/protocol';
import { hoyLocal } from '../../cobranza/vivo';
import type { EstadoMode } from '../../estado';
import { comoMetodo } from '../derive';
import { DetalleScreen } from './screen';
import type { DetalleData, DetalleScreenProps, VentaDetalle } from './types';

type Carga =
  | { readonly state: 'happy'; readonly data: DetalleData }
  | { readonly state: EstadoMode };

/** «Hoy 14:52», or the date when the ticket is from another day. */
function cuando(fecha: string, hora: string): string {
  if (fecha === hoyLocal()) return `Hoy ${hora}`;
  return new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short' }).format(
    new Date(`${fecha}T12:00:00`),
  );
}

function comoVenta(t: TicketPara): VentaDetalle {
  return {
    id: t.id,
    folio: `V-${String(t.folio).padStart(4, '0')}`,
    cuando: cuando(t.fecha, t.hora),
    metodo: comoMetodo(t.metodo),
    lineas: t.lineas.map((l) => ({
      productoId: l.productoId,
      nombre: l.nombre,
      precio: BigInt(l.precioCentavos),
      cantidad: l.cantidad,
      categoria: categoriaDe(l.categoria),
    })),
    ...(t.recibidoCentavos === null ? {} : { recibido: BigInt(t.recibidoCentavos) }),
    ...(t.cliente === null || t.clienteSaldoCentavos === null
      ? {}
      : { fiado: { cliente: t.cliente, saldo: BigInt(t.clienteSaldoCentavos) } }),
    ...(t.cancelada === null ? {} : { cancelada: { motivo: t.cancelada } }),
  };
}

/** Read the turno's ticket by folio; the shell's strings stay fixture-flavored (O-38). */
async function leerDetalle(
  cred: Credenciales,
  folio: number,
): Promise<{ turnoDesde: string; capturo: string; venta: VentaDetalle | null }> {
  const { device, sesion } = cred;
  if (device === null || sesion === null) throw new Error('sin sesión');
  const r = await registerRuntime().ticket(device.businessId, device.deviceId, folio);
  return {
    turnoDesde: r.turnoDesde,
    capturo: r.capturo,
    venta: r.ticket === null ? null : comoVenta(r.ticket),
  };
}

/** The screen's data over a loaded ticket; the shell's strings stay fixture-flavored (O-38). */
function detalleVivo(negocio: string, r: Awaited<ReturnType<typeof leerDetalle>>): DetalleData {
  return {
    vinculado: true,
    negocio,
    operador: r.capturo,
    caja: 'Caja 1',
    turno: `Hoy, abierto ${r.turnoDesde}`,
    venta: r.venta,
  };
}

export function DetalleVentaViva({
  folio,
  fixture,
  forzado = 'happy',
}: {
  readonly folio: string;
  readonly fixture: DetalleScreenProps;
  readonly forzado?: DetalleScreenProps['state'];
}): ReactNode {
  const cred = useCredenciales();
  const linked = cred.device !== null && cred.sesion !== null;
  const [carga, setCarga] = useState<Carga>({ state: 'happy', data: fixture.data });

  const cargar = useCallback(
    (c: Credenciales): void => {
      setCarga({ state: 'loading' });
      void leerDetalle(c, Number.parseInt(folio.replace(/^V-/, ''), 10))
        .then((r) => setCarga({ state: 'happy', data: detalleVivo(fixture.data.negocio, r) }))
        .catch(() => setCarga({ state: 'error' }));
    },
    [cred, folio, fixture.data.negocio],
  );
  useEffect(() => {
    if (linked) cargar(cred);
  }, [cred, linked, cargar]);

  if (!linked) return <DetalleScreen {...fixture} state={forzado} />;
  return (
    <DetalleScreen
      state={carga.state}
      data={carga.state === 'happy' ? carga.data : { ...fixture.data, venta: null }}
      recargar={linked ? () => cargar(cred) : undefined}
    />
  );
}
