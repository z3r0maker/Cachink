import type { FacturaRecibida } from '@xangarro/application/corp';
import type { FacturaDelMes, Movimiento } from '@xangarro/data-corp';
import { formatMoney, tipoPersona } from '@xangarro/domain';
import { ACCOUNTS, CATEGORIAS_GASTO } from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';

/**
 * Facturas recibidas as board CD-06b shows them (E-11): one row per received
 * CFDI of the month, plus each expense registered without one («Sin CFDI»),
 * and the four tiles above the list.
 */
export type EstadoFila = 'Vigente' | 'Sin verificar' | 'Cancelada' | 'Sin CFDI';

export type Destino =
  | { readonly tipo: 'enlace'; readonly href: string; readonly texto: string }
  | { readonly tipo: 'texto'; readonly texto: string }
  /** An invoice on credit still owed: «Por pagar» with «Registrar pago» and «Cancelar». */
  | { readonly tipo: 'por_pagar'; readonly uuid: string };

export interface FilaFactura {
  readonly key: string;
  readonly fecha: string;
  readonly proveedor: string;
  readonly sub: string;
  readonly subtotal: string;
  readonly iva: string;
  readonly retenciones: string;
  readonly estado: EstadoFila;
  readonly destino: Destino;
}

export interface ResumenFacturas {
  readonly recibidas: number;
  readonly porPagar: number;
  /** Centavos owed to suppliers by invoices on credit. */
  readonly debido: bigint;
  /** Centavos of IVA creditable: paid invoices only (owner decision 9). */
  readonly ivaAcreditable: bigint;
  readonly retenciones: bigint;
  readonly canceladas: number;
}

const retenido = (f: FacturaRecibida) => f.cfdi.retencionIsr + f.cfdi.retencionIva;
const menos = (c: bigint) => (c === 0n ? formatMoney(0n) : `−${formatMoney(c)}`);
const nombreCategoria = (f: FacturaRecibida) =>
  f.categoria === null ? 'Ver movimiento' : ACCOUNTS[f.categoria].nombre;

/** Owed: registered on credit, not paid, its expense still standing. */
export const porPagar = (d: FacturaDelMes) =>
  d.factura.estado === 'registrada' &&
  d.factura.cfdi.metodoPago === 'PPD' &&
  d.factura.pagoEntryId === null &&
  !d.revertida;

/** Paid and standing: what counts for IVA and withholdings. */
const pagada = (d: FacturaDelMes) =>
  d.factura.estado === 'registrada' && !d.revertida && !porPagar(d);

const persona = (rfc: string): string =>
  tipoPersona(rfc) === 'fisica' ? 'persona física' : 'persona moral';

function subDe(f: FacturaRecibida): string {
  const credito = f.cfdi.metodoPago === 'PPD';
  const pago = credito ? (f.pagoEntryId === null ? 'a crédito (PPD)' : 'a crédito, pagada') : '';
  return [`RFC ${f.cfdi.emisor.rfc}`, persona(f.cfdi.emisor.rfc), pago, f.cfdi.concepto]
    .filter((p) => p !== '')
    .join(' · ');
}

function destinoDe(d: FacturaDelMes): Destino {
  const f = d.factura;
  if (porPagar(d)) return { tipo: 'por_pagar', uuid: f.cfdi.uuid };
  if (f.entryId === null) return { tipo: 'texto', texto: 'No se registró' };
  if (f.estado === 'cancelada' || d.revertida) return { tipo: 'texto', texto: 'Se revirtió' };
  return { tipo: 'enlace', href: `/empresa/movimientos/${f.entryId}`, texto: nombreCategoria(f) };
}

function estadoDe(d: FacturaDelMes): EstadoFila {
  if (d.factura.estado === 'cancelada') return 'Cancelada';
  return d.factura.estadoSat === 'sin_verificar' ? 'Sin verificar' : 'Vigente';
}

export function filaFactura(d: FacturaDelMes): FilaFactura {
  const c = d.factura.cfdi;
  return {
    key: c.uuid,
    fecha: fechaCorta(c.fecha),
    proveedor: c.emisor.nombre || c.emisor.rfc,
    sub: subDe(d.factura),
    subtotal: formatMoney(c.subtotal),
    iva: formatMoney(c.iva),
    retenciones: menos(retenido(d.factura)),
    estado: estadoDe(d),
    destino: destinoDe(d),
  };
}

const suma = (m: Movimiento, cuentas: readonly string[], lado: 'debe' | 'haber') =>
  m.lines.filter((l) => cuentas.includes(l.cuenta)).reduce((acc, l) => acc + l[lado], 0n);

/** An expense standing in the month that came in without an XML. */
export const esSinCfdi = (m: Movimiento) =>
  m.kind === 'gasto' && m.source !== 'cfdi' && m.reversesEntryId === null && m.reversedBy === null;

export function filaSinCfdi(m: Movimiento): FilaFactura {
  const categoria = CATEGORIAS_GASTO.find((c) => m.lines.some((l) => l.cuenta === c));
  const usd = m.moneda === 'USD' && m.montoOriginal !== null;
  return {
    key: m.id,
    fecha: fechaCorta(m.fecha),
    proveedor: m.contraparte || m.concepto,
    sub: ['Sin CFDI', usd ? 'extranjero' : '', m.contraparte ? m.concepto : '']
      .filter((p) => p !== '')
      .join(' · '),
    subtotal: usd
      ? `USD ${formatMoney(m.montoOriginal ?? 0n).replace('$', '')}`
      : formatMoney(suma(m, CATEGORIAS_GASTO, 'debe')),
    iva: formatMoney(suma(m, ['iva_acreditable'], 'debe')),
    retenciones: menos(suma(m, ['retenciones_por_pagar'], 'haber')),
    estado: 'Sin CFDI',
    destino: {
      tipo: 'enlace',
      href: `/empresa/movimientos/${m.id}`,
      texto: categoria === undefined ? 'Ver movimiento' : ACCOUNTS[categoria].nombre,
    },
  };
}

export function resumenFacturas(
  facturas: readonly FacturaDelMes[],
  sinCfdi: readonly Movimiento[],
): ResumenFacturas {
  const deuda = facturas.filter(porPagar);
  const pagadas = facturas.filter(pagada);
  return {
    recibidas: facturas.length + sinCfdi.length,
    porPagar: deuda.length,
    debido: deuda.reduce((acc, d) => acc + d.factura.cfdi.subtotal + d.factura.cfdi.iva, 0n),
    ivaAcreditable:
      pagadas.reduce((acc, d) => acc + d.factura.cfdi.iva, 0n) +
      sinCfdi.reduce((acc, m) => acc + suma(m, ['iva_acreditable'], 'debe'), 0n),
    retenciones: pagadas.reduce((acc, d) => acc + retenido(d.factura), 0n),
    canceladas: facturas.filter((d) => d.factura.estado === 'cancelada').length,
  };
}
