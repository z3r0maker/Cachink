'use client';

/** Detalle de venta's comprobante: the ticket as the share dialog takes it (O-34). */

import type { Comprobante } from '../../caja/receipt';
import { totalDe } from './copy';
import type { VentaDetalle } from './types';

export function comprobante(negocio: string, v: VentaDetalle, caja: string): Comprobante {
  const total = totalDe(v);
  const hora = /\d{1,2}:\d{2}/.exec(v.cuando)?.[0];
  return {
    negocio,
    folio: v.folio,
    caja,
    ...(hora === undefined ? {} : { hora }),
    venta: {
      // A line known only by pieces carries no price; the receipt leaves its amount blank.
      lines: v.lineas.map((l) => ({
        productoId: l.productoId,
        nombre: l.nombre,
        cantidad: l.cantidad,
        precio: l.precio ?? 0n,
      })),
      total,
      metodo: v.metodo,
      cambio: v.recibido === undefined ? null : v.recibido - total,
      nota: '',
    },
    // On a linked register this id fetches the branded N-20 PNG (N-21).
    ...(v.id === undefined ? {} : { ticketId: v.id }),
  };
}
