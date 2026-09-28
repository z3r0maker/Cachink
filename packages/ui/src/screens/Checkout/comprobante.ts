/**
 * The comprobante of a sale just made (not a CFDI): as text for WhatsApp,
 * Mensajes and the share menu (the web caja's `receipt.ts` `receiptText`),
 * and as the business's N-20 template for the preview (`comprobanteSvg`,
 * the business → negocio mapping of the web's `server/comprobante/datos.ts`,
 * without the logo, which the phone does not hold).
 */
import {
  comprobanteSvg,
  formatMoney,
  monograma,
  type Business,
  type Comprobante,
  type MetodoPagoComprobante,
  type PlantillaComprobante,
} from '@xangarro/domain';
import { colors } from '@xangarro/tokens';
import { hoyLocal } from '@xangarro/caja';
import { importe } from '@xangarro/caja/caja';
import type { VentaHecha } from './venta-hecha';

export const GRACIAS = 'Gracias por su compra';
export const NO_FISCAL = 'Este documento no es un comprobante fiscal (CFDI).';
export const HECHO_CON = 'Hecho con Xangarro!';

export interface Marca {
  readonly negocio: string;
  readonly leyenda: string | null;
  readonly whatsapp: string | null;
  readonly direccion: string | null;
}

export function marcaDe(b: Business | null): Marca {
  return {
    negocio: b?.nombre ?? 'Tu negocio',
    leyenda: b?.receiptLeyenda ?? null,
    whatsapp: b?.whatsapp ?? null,
    direccion: b?.addressPrint === true ? (b.direccion ?? null) : null,
  };
}

/** «14 de mayo de 2026». */
const fechaLarga = (d: Date): string =>
  new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }).format(d);

/** How it was paid, as the receipt's last line says it. */
export function pagoTexto(v: VentaHecha): string {
  if (v.recibido !== null && v.cambio !== null)
    return `Efectivo: ${formatMoney(v.recibido)} · Cambio: ${formatMoney(v.cambio)}`;
  if (v.cliente !== null) return `A cuenta de: ${v.cliente}`;
  return `${v.metodo}: ${formatMoney(v.total)}`;
}

export function comprobanteTexto(v: VentaHecha, m: Marca, hoy: Date = new Date()): string {
  return [
    m.negocio,
    ...(m.direccion ? [m.direccion] : []),
    `Venta ${v.folio} · ${fechaLarga(hoy)}, ${v.hora} h`,
    '',
    ...v.lines.map((l) => `${l.cantidad} x ${l.nombre} ${formatMoney(importe(l))}`),
    '',
    `Total: ${formatMoney(v.total)}`,
    pagoTexto(v),
    '',
    m.leyenda ?? GRACIAS,
    ...(m.whatsapp ? [`WhatsApp ${m.whatsapp}`] : []),
    NO_FISCAL,
    HECHO_CON,
  ].join('\n');
}

const METODO: Record<VentaHecha['metodo'], MetodoPagoComprobante> = {
  Efectivo: 'Efectivo',
  Tarjeta: 'Tarjeta',
  Transferencia: 'Transferencia',
  Fiado: 'Crédito',
};

/** The template holds three concepts; the rest go together as one line. */
function conceptos(v: VentaHecha): Comprobante['conceptos'] {
  const todos = v.lines.map((l) => ({
    concepto: l.nombre,
    cantidad: l.cantidad,
    importe: importe(l),
  }));
  if (todos.length <= 3) return todos;
  const resto = todos.slice(2);
  return [
    ...todos.slice(0, 2),
    {
      concepto: `${resto.length} productos más`,
      cantidad: resto.reduce((n, c) => n + c.cantidad, 0),
      importe: resto.reduce((a, c) => a + c.importe, 0n),
    },
  ];
}

function plantillaDe(b: Business | null): PlantillaComprobante {
  const t = b?.receiptTemplate;
  return t === 'moderno' || t === 'clasico' || t === 'minimal' ? t : 'ticket';
}

export function comprobanteSvgDe(v: VentaHecha, b: Business | null): string {
  const m = marcaDe(b);
  const c: Comprobante = {
    negocio: {
      nombre: m.negocio,
      monograma: monograma(m.negocio),
      whatsapp: m.whatsapp ?? undefined,
      leyenda: m.leyenda ?? undefined,
      direccion: m.direccion ?? undefined,
      acento: b?.brandColor ?? colors.yellow,
    },
    folio: v.folio,
    fechaHora: `${hoyLocal()}T${v.hora}:00`,
    conceptos: conceptos(v),
    total: v.total,
    metodoPago: METODO[v.metodo],
    mostrarMarcaXangarro: true,
  };
  return comprobanteSvg(plantillaDe(b), c, { destino: 'whatsapp' });
}
