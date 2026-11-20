import { formatMoney } from '@xangarro/domain';
import {
  ACCOUNTS,
  isAccountKey,
  nombreDeLaBalanza,
  nombreDelPaquete,
  type Balanza,
  type EstadoCodigos,
} from '@xangarro/domain/corp';

import type { EmitidasDelPaquete } from './contador-emitidas';
import { nombreMes } from './fechas';

/**
 * «Paquete para el contador» (E-43, board CD-10d): a drawer over Cierre del
 * mes with the package's chip, a warning while codes are missing, what goes
 * in it, the balanza as the CSV writes it, and the download. Pure.
 */
export interface DatosContador {
  readonly mes: string;
  readonly cerrado: boolean;
  /** Cierre's steps still pending. */
  readonly faltanPasos: number;
  readonly codigos: EstadoCodigos;
  readonly balanza: Balanza;
  readonly emitidas: EmitidasDelPaquete;
  /** Registered received invoices of the month. */
  readonly recibidas: number;
  /** Expenses marked non-deductible: no CFDI, only the balanza. */
  readonly noDeducibles: number;
  /** Deductible expenses still without their CFDI. */
  readonly sinFactura: number;
  /** Titles of the month's acuses and statements. */
  readonly comprobantes: readonly string[];
  /** «ISR e IVA» is owed and not yet presented. */
  readonly impuestosPendientes: boolean;
}

export interface Parte {
  readonly nombre: string;
  readonly detalle: string;
  readonly aviso: boolean;
  readonly archivo: string;
}

export interface FilaVista {
  readonly cuenta: string;
  readonly codigo: string | null;
  readonly nombre: string;
  readonly inicial: string;
  readonly debe: string;
  readonly haber: string;
  readonly final: string;
}

export interface VistaPaquete {
  readonly chip: 'Final' | 'Preliminar';
  readonly sub: string;
  readonly aviso: { readonly titulo: string; readonly texto: string } | null;
  readonly partes: readonly Parte[];
  readonly filas: readonly FilaVista[];
  readonly total: { readonly texto: string; readonly debe: string; readonly haber: string };
  readonly boton: string;
  readonly zip: string;
  readonly href: string;
  readonly nota: string;
}

const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/** «A, B y C»; past four, the first three and how many more. */
function enumerar(nombres: readonly string[]): string {
  if (nombres.length > 4) return `${nombres.slice(0, 3).join(', ')} y ${nombres.length - 3} más`;
  return nombres.length < 2
    ? (nombres[0] ?? '')
    : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1) ?? ''}`;
}

const nombreDe = (cuenta: string) => (isAccountKey(cuenta) ? ACCOUNTS[cuenta].nombre : cuenta);

function avisoDe(c: EstadoCodigos, b: Balanza): VistaPaquete['aviso'] {
  const n = b.sinCodigo.length;
  if (n > 0)
    return {
      titulo:
        n === 1 ? '1 cuenta no tiene código agrupador' : `${n} cuentas no tienen código agrupador`,
      texto: `La balanza sale con ${n === 1 ? 'esa celda vacía' : 'esas celdas vacías'}: ${enumerar(b.sinCodigo.map(nombreDe))}. Pídeselos al contador.`,
    };
  if (c.validacion === null)
    return {
      titulo: 'Los códigos agrupadores aún no están validados',
      texto: 'Ya están todos, pero el contador no los ha validado. Márcalos cuando lo haga.',
    };
  return null;
}

function balanzaParte(d: DatosContador): Parte {
  const total = d.balanza.filas.length;
  const sin = d.balanza.sinCodigo.length;
  const detalle =
    sin === 0
      ? `${total} cuentas con su código agrupador · saldo inicial, debe, haber y saldo final`
      : sin >= total
        ? `${total} cuentas · ninguna con su código agrupador`
        : `${total} cuentas · ${total - sin} con su código agrupador, ${sin} sin él`;
  return {
    nombre: 'Balanza de comprobación',
    detalle,
    aviso: sin > 0,
    archivo: nombreDeLaBalanza(d.mes),
  };
}

function emitidasParte(d: DatosContador): Parte {
  const n = d.emitidas.cfdis.length;
  const base = n === 0 ? 'Ninguna factura emitida' : `${n} CFDI con su folio fiscal`;
  const porTimbrar = d.emitidas.global === 'por_timbrar';
  const detalle = porTimbrar
    ? `${base} · la factura global de ${nombreMes(d.mes)} aún no se timbra`
    : d.emitidas.global === 'timbrada' && d.emitidas.nominativas > 0
      ? `${base} · ${d.emitidas.nominativas} a clientes y la global a «Público en general»`
      : base;
  return { nombre: 'Facturas emitidas', detalle, aviso: porTimbrar, archivo: 'emitidas.csv' };
}

function recibidasParte(d: DatosContador): Parte {
  const k = d.noDeducibles;
  const partes = [
    d.recibidas === 0 ? 'Ninguna factura recibida registrada' : `${d.recibidas} XML`,
    k === 0
      ? ''
      : k === 1
        ? 'el gasto sin factura, marcado no deducible, va solo en la balanza'
        : `los ${k} gastos sin factura, marcados no deducibles, van solo en la balanza`,
    d.sinFactura === 0
      ? ''
      : d.sinFactura === 1
        ? '1 gasto aún sin su factura'
        : `${d.sinFactura} gastos aún sin su factura`,
  ];
  const detalle = partes.filter((p) => p !== '').join(' · ');
  return { nombre: 'Facturas recibidas', detalle, aviso: d.sinFactura > 0, archivo: 'recibidas/' };
}

function acusesParte(d: DatosContador): Parte {
  const partes = [
    d.comprobantes.length === 0
      ? `Nada del Expediente para ${nombreMes(d.mes)}`
      : d.comprobantes.join(' · '),
    d.impuestosPendientes ? 'la declaración de ISR e IVA aún no se presenta' : '',
  ];
  const detalle = partes.filter((p) => p !== '').join(' · ');
  const aviso = d.impuestosPendientes || d.comprobantes.length === 0;
  return { nombre: 'Acuses y comprobantes', detalle, aviso, archivo: 'acuses/' };
}

const filaVista = (f: Balanza['filas'][number]): FilaVista => ({
  cuenta: f.cuenta,
  codigo: f.codigo,
  nombre: f.nombre,
  inicial: formatMoney(f.inicial),
  debe: formatMoney(f.debe),
  haber: formatMoney(f.haber),
  final: formatMoney(f.final),
});

function subDe(d: DatosContador): string {
  const mes = cap(nombreMes(d.mes));
  if (d.cerrado)
    return `${mes} está cerrado, así que el paquete ya no cambia. Todo lo que el contador necesita del mes, en un archivo.`;
  const faltan =
    d.faltanPasos === 0
      ? 'ya no le falta ningún paso'
      : d.faltanPasos === 1
        ? 'falta 1 paso'
        : `faltan ${d.faltanPasos} pasos`;
  return `${mes} sigue abierto: ${faltan}. Sirve para que el contador prepare la declaración; el final sale al cerrar el mes.`;
}

export function vistaDelPaquete(d: DatosContador): VistaPaquete {
  const mes = nombreMes(d.mes);
  const b = d.balanza;
  return {
    chip: d.cerrado ? 'Final' : 'Preliminar',
    sub: subDe(d),
    aviso: avisoDe(d.codigos, b),
    partes: [balanzaParte(d), emitidasParte(d), recibidasParte(d), acusesParte(d)],
    filas: b.filas.map(filaVista),
    total: {
      texto: `${b.filas.length} cuentas · ${b.cuadra ? 'cuadra' : 'no cuadra'}`,
      debe: formatMoney(b.debe),
      haber: formatMoney(b.haber),
    },
    boton: d.cerrado ? `Descargar el paquete de ${mes}` : `Descargar el preliminar de ${mes}`,
    zip: nombreDelPaquete(d.mes, d.cerrado ? 'final' : 'preliminar'),
    href: `/empresa/cierre/paquete?mes=${d.mes}`,
    nota: d.cerrado
      ? `Si ${mes} se reabre y se corrige, el paquete que descargues después ya trae la corrección.`
      : 'El preliminar se arma cada vez que lo descargas, con lo que hay ese día.',
  };
}
