import type { Money } from '../../money/index.js';
import { convertirAMxn, periodOf } from '../ledger/rules.js';
import { CfdiInvalidoError } from './errors.js';
import { hijo, hijos, leerXml, XmlInvalidoError, type Nodo } from './xml.js';

/**
 * A received CFDI 4.0, read from its XML (E-11). Amounts are MXN centavos;
 * a USD invoice is converted at the rate the invoice itself states.
 */
export interface CfdiRecibido {
  /** The folio fiscal, upper case. */
  readonly uuid: string;
  /** Issue date, `YYYY-MM-DD`. */
  readonly fecha: string;
  /** Serie and folio as the supplier numbers it, if it does. */
  readonly folio: string | null;
  readonly emisor: { readonly rfc: string; readonly nombre: string };
  readonly receptor: { readonly rfc: string; readonly uso: string };
  /** PUE: paid in one payment. PPD: on credit, paid later (owner decision 9). */
  readonly metodoPago: 'PUE' | 'PPD';
  readonly moneda: 'MXN' | 'USD';
  /** The cost before IVA: subtotal less discount, plus taxes other than IVA. */
  readonly subtotal: Money;
  readonly iva: Money;
  readonly retencionIsr: Money;
  readonly retencionIva: Money;
  /** What is paid to the supplier: subtotal + IVA − withholdings. */
  readonly total: Money;
  /** The dollar total and its rate, for a USD invoice. */
  readonly usd: { readonly montoOriginal: Money; readonly tipoCambio: string } | null;
  /** The first concept's description, and how many more there are. */
  readonly concepto: string;
  /** What the SAT's status service asks for besides the RFCs and the UUID. */
  readonly sat: { readonly total: string; readonly sello8: string };
}

const IMPORTE = /^(\d{1,15})(?:\.(\d{1,6}))?$/;

/** A CFDI amount (up to six decimals) → centavos, rounded half up. */
function importe(value: string | undefined): Money {
  if (value === undefined) return 0n;
  const m = IMPORTE.exec(value.trim());
  if (m === null) throw new CfdiInvalidoError('importes');
  const micros = BigInt(m[1]!) * 1_000_000n + BigInt((m[2] ?? '').padEnd(6, '0'));
  return (micros + 5_000n) / 10_000n;
}

interface Impuestos {
  readonly iva: Money;
  readonly otros: Money;
  readonly isr: Money;
  readonly ivaRetenido: Money;
}

/** The comprobante-level taxes (each concept repeats them; those are ignored). */
function impuestos(raiz: Nodo): Impuestos {
  const nodo = hijo(raiz, 'Impuestos');
  const suma = (lista: readonly Nodo[], pred: (n: Nodo) => boolean) =>
    lista.filter(pred).reduce((acc, n) => acc + importe(n.attrs.get('Importe')), 0n);
  const traslados = hijos(hijo(nodo, 'Traslados'), 'Traslado');
  const retenciones = hijos(hijo(nodo, 'Retenciones'), 'Retencion');
  const impuesto = (clave: string) => (n: Nodo) => n.attrs.get('Impuesto') === clave;
  if (retenciones.some((r) => !['001', '002'].includes(r.attrs.get('Impuesto') ?? ''))) {
    throw new CfdiInvalidoError('importes');
  }
  const locales = hijo(hijo(raiz, 'Complemento'), 'ImpuestosLocales');
  return {
    iva: suma(traslados, impuesto('002')),
    otros:
      suma(traslados, (n) => !impuesto('002')(n)) + importe(locales?.attrs.get('TotaldeTraslados')),
    isr: suma(retenciones, impuesto('001')),
    ivaRetenido: suma(retenciones, impuesto('002')),
  };
}

function tipo(raiz: Nodo): void {
  if (raiz.nombre !== 'Comprobante') throw new CfdiInvalidoError('no_es_cfdi');
  if (raiz.attrs.get('Version') !== '4.0') throw new CfdiInvalidoError('version');
  const t = raiz.attrs.get('TipoDeComprobante');
  if (t === 'P') throw new CfdiInvalidoError('complemento_pago');
  if (t !== 'I') throw new CfdiInvalidoError('no_es_ingreso');
}

function timbre(raiz: Nodo): string {
  const uuid = hijo(hijo(raiz, 'Complemento'), 'TimbreFiscalDigital')?.attrs.get('UUID');
  if (uuid === undefined || !/^[0-9A-F]{8}(-[0-9A-F]{4}){3}-[0-9A-F]{12}$/i.test(uuid)) {
    throw new CfdiInvalidoError('sin_timbre');
  }
  return uuid.toUpperCase();
}

/** MXN stays; USD converts at the invoice's own rate; anything else is refused. */
function enPesos(raiz: Nodo): (centavos: Money) => Money {
  const moneda = raiz.attrs.get('Moneda');
  if (moneda === 'MXN') return (c) => c;
  const tc = raiz.attrs.get('TipoCambio');
  if (
    moneda !== 'USD' ||
    tc === undefined ||
    !/^\d{1,4}(\.\d{1,6})?$/.test(tc) ||
    Number(tc) === 0
  ) {
    throw new CfdiInvalidoError('moneda');
  }
  return (c) => (c === 0n ? 0n : convertirAMxn(c, tc));
}

function concepto(raiz: Nodo): string {
  const lista = hijos(hijo(raiz, 'Conceptos'), 'Concepto');
  const primero = (lista[0]?.attrs.get('Descripcion') ?? '').trim().slice(0, 120);
  return lista.length > 1 ? `${primero} y ${lista.length - 1} más` : primero;
}

function montos(raiz: Nodo) {
  const a = raiz.attrs;
  const imp = impuestos(raiz);
  const base = importe(a.get('SubTotal')) - importe(a.get('Descuento'));
  const total = importe(a.get('Total'));
  const cuadra = base + imp.iva + imp.otros - imp.isr - imp.ivaRetenido - total;
  if (base <= 0n || cuadra > 1n || cuadra < -1n) throw new CfdiInvalidoError('importes');
  const mxn = enPesos(raiz);
  const subtotal = mxn(base + imp.otros);
  const iva = mxn(imp.iva);
  const [retencionIsr, retencionIva] = [mxn(imp.isr), mxn(imp.ivaRetenido)];
  return {
    subtotal,
    iva,
    retencionIsr,
    retencionIva,
    total: subtotal + iva - retencionIsr - retencionIva,
    original: total,
  };
}

function leerRaiz(xml: string): Nodo {
  try {
    return leerXml(xml);
  } catch (e) {
    if (e instanceof XmlInvalidoError) throw new CfdiInvalidoError('no_es_cfdi');
    throw e;
  }
}

const attr = (n: Nodo | undefined, name: string): string => n?.attrs.get(name) ?? '';

/** Emisor, receptor and the dates and numbers that identify the invoice. */
function identidad(raiz: Nodo) {
  const emisor = hijo(raiz, 'Emisor');
  const receptor = hijo(raiz, 'Receptor');
  const fecha = attr(raiz, 'Fecha').slice(0, 10);
  if (periodOf(fecha) === null || emisor === undefined || receptor === undefined) {
    throw new CfdiInvalidoError('no_es_cfdi');
  }
  return {
    fecha,
    folio: `${attr(raiz, 'Serie')}${attr(raiz, 'Folio')}` || null,
    emisor: { rfc: attr(emisor, 'Rfc').toUpperCase(), nombre: attr(emisor, 'Nombre') },
    receptor: { rfc: attr(receptor, 'Rfc').toUpperCase(), uso: attr(receptor, 'UsoCFDI') },
  };
}

/** Reads a received invoice; throws `CfdiInvalidoError` saying why it is not one. */
export function leerCfdi(xml: string): CfdiRecibido {
  const raiz = leerRaiz(xml);
  tipo(raiz);
  const uuid = timbre(raiz);
  const { original, ...m } = montos(raiz);
  const usd = attr(raiz, 'Moneda') === 'USD';
  return {
    uuid,
    ...identidad(raiz),
    metodoPago: attr(raiz, 'MetodoPago') === 'PPD' ? 'PPD' : 'PUE',
    moneda: usd ? 'USD' : 'MXN',
    ...m,
    usd: usd ? { montoOriginal: original, tipoCambio: attr(raiz, 'TipoCambio') } : null,
    concepto: concepto(raiz),
    sat: { total: attr(raiz, 'Total'), sello8: attr(raiz, 'Sello').slice(-8) },
  };
}
