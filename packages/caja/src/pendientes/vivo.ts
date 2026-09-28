/**
 * Registros por enviar, live (O-27): the Worker's grouped outbox rows said the
 * way the design lists them («Venta V-0412», «3 pastor · 1 gringa · efectivo»).
 * Pure, so the tests pin every wording.
 */

import type { ClaseMovimiento, PendienteCrudo } from '../lectura/cola-shapes';
import { hhmmLocal } from '../comun/fechas';
import type { RegistroEnCola } from './types';

/** How many lines a sale's detail names before «y N más». */
const LINEAS = 3;
const CORTO = 60;

export const folioVenta = (folio: number): string => `V-${String(folio).padStart(4, '0')}`;

const corto = (s: string): string => (s.length > CORTO ? `${s.slice(0, CORTO - 1)}…` : s);

const plural = (n: number, uno: string, varios: string): string => `${n} ${n === 1 ? uno : varios}`;

/** «3 pastor · 1 gringa · y 2 más · efectivo». */
export function detalleVenta(
  lineas: readonly { readonly concepto: string; readonly cantidad: number }[],
  metodo: string,
): string {
  const partes = lineas.slice(0, LINEAS).map((l) => `${l.cantidad} ${l.concepto}`);
  if (lineas.length > LINEAS) partes.push(`y ${lineas.length - LINEAS} más`);
  return [...partes, metodo.toLowerCase()].join(' · ');
}

const TITULO: Readonly<Record<ClaseMovimiento, string>> = {
  deposito: 'Depósito a la caja',
  retiro: 'Retiro de la caja',
  apertura: 'Apertura de caja',
  cierre: 'Cierre de turno',
  respuesta: 'Respuesta al dueño',
  inventario: 'Movimientos de inventario',
  corte: 'Corte del día',
  entrega: 'Entrega a crédito',
  conversion: 'Conversión de inventario',
  conteo: 'Conteo de inventario',
  producto: 'Producto',
  cliente: 'Cliente',
};

type Movimiento = Extract<PendienteCrudo, { readonly tipo: 'movimiento' }>;

function detalleMovimiento(m: Movimiento): string {
  if (m.clase === 'inventario') {
    const partes = [
      m.salidas ? plural(m.salidas, 'salida', 'salidas') : '',
      m.entradas ? plural(m.entradas, 'entrada', 'entradas') : '',
    ].filter(Boolean);
    return partes.join(' · ');
  }
  if (m.clase === 'apertura') return 'Fondo contado al abrir';
  if (m.clase === 'cierre') return 'Efectivo contado al cerrar';
  if (m.clase === 'respuesta' && m.texto !== null) return `“${corto(m.texto)}”`;
  return m.texto === null ? '' : corto(m.texto);
}

function titulo(p: PendienteCrudo): string {
  if (p.tipo === 'venta') return `Venta ${folioVenta(p.folio)}${p.cancelada ? ' · cancelada' : ''}`;
  if (p.tipo === 'gasto') return `Gasto · ${p.concepto}`;
  if (p.tipo === 'abono') return `Abono · ${p.cliente ?? 'Cliente'}`;
  const base = TITULO[p.clase];
  return (p.clase === 'producto' || p.clase === 'cliente') && p.texto
    ? `${base} · ${p.texto}`
    : base;
}

function detalle(p: PendienteCrudo): string {
  if (p.tipo === 'venta') return detalleVenta(p.lineas, p.metodo);
  if (p.tipo === 'gasto') return p.proveedor ?? 'Gasto de caja chica';
  if (p.tipo === 'abono') return `En ${p.metodo.toLowerCase()}`;
  if (p.clase === 'producto' || p.clase === 'cliente') return 'Cambio en el catálogo';
  return detalleMovimiento(p);
}

function monto(p: PendienteCrudo): bigint | null {
  if (p.tipo === 'venta') return BigInt(p.totalCentavos);
  if (p.tipo === 'movimiento') return p.montoCentavos === null ? null : BigInt(p.montoCentavos);
  return BigInt(p.montoCentavos);
}

/** One outbox record as a row of «La cola». */
export function comoRegistro(p: PendienteCrudo): RegistroEnCola {
  const propia = p.tipo === 'venta' ? p.hora : null;
  return {
    id: `${p.tipo}:${p.id}`,
    tipo: p.tipo,
    titulo: titulo(p),
    detalle: detalle(p),
    monto: monto(p),
    hora: propia ?? hhmmLocal(p.en),
    ...(p.reintento === true
      ? {
          reintento: true,
          ultimoIntento: p.ultimoIntento ?? null,
          proximoIntento: p.proximoIntento ?? null,
        }
      : {}),
  };
}
