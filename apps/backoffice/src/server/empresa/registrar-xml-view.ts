import type { FacturaRecibida, Rechazo } from '@xangarro/application/corp';
import { formatMoney, formatMonth } from '@xangarro/domain';
import type { CategoriaGasto } from '@xangarro/domain/corp';

import { fueraDe, type Recordada } from './revision-view';

/**
 * Board CD-06d, Registrar gasto with one XML attached (E-11): what was read,
 * what the SAT said, the XML's figures, and the category the supplier had
 * last time. Pure, so the client can recompute the withholdings note as the
 * payment date changes.
 */
export type TonoMonto = 'normal' | 'debe' | 'total';

export interface MontoXml {
  readonly label: string;
  readonly value: string;
  readonly tono: TonoMonto;
}

export interface PanelXml {
  readonly uuid: string;
  readonly titulo: string;
  readonly sub: string;
  readonly proveedor: string;
  readonly concepto: string;
  /** The invoice's date: a paid invoice's payment date until the founder changes it. */
  readonly fecha: string;
  /** PUE: it left the bank already, so the founder says when. */
  readonly pagada: boolean;
  readonly subtotal: string;
  readonly montos: readonly MontoXml[];
  readonly conRetenciones: boolean;
  readonly categoria: CategoriaGasto | null;
  /** A project id, or '' for «Compartido». */
  readonly proyecto: string;
  readonly nota: string;
}

const retenido = (label: string, centavos: bigint): MontoXml[] =>
  centavos === 0n ? [] : [{ label, value: `−${formatMoney(centavos)}`, tono: 'debe' }];

function montosDe(f: FacturaRecibida): readonly MontoXml[] {
  const c = f.cfdi;
  return [
    { label: 'Subtotal', value: formatMoney(c.subtotal), tono: 'normal' },
    { label: 'IVA', value: formatMoney(c.iva), tono: 'normal' },
    ...retenido('ISR retenido', c.retencionIsr),
    ...retenido('IVA retenido', c.retencionIva),
    {
      label: c.metodoPago === 'PUE' ? 'Salió del banco' : 'Por pagar',
      value: formatMoney(c.total),
      tono: 'total',
    },
  ];
}

export function panelXml(f: FacturaRecibida, recordada: Recordada | null): PanelXml {
  const c = f.cfdi;
  const pagada = c.metodoPago === 'PUE';
  const nombre = c.emisor.nombre.trim();
  return {
    uuid: c.uuid,
    titulo: `${f.archivo} leído · ${f.estadoSat === 'vigente' ? 'vigente' : 'sin verificar'} en el SAT`,
    sub: `Folio fiscal ${c.uuid} · ${pagada ? 'pagada en una exhibición (PUE)' : 'a crédito (PPD): queda por pagar'}`,
    proveedor: nombre === '' ? `RFC ${c.emisor.rfc}` : `${nombre} · RFC ${c.emisor.rfc}`,
    concepto: c.concepto,
    fecha: c.fecha,
    pagada,
    subtotal: formatMoney(c.subtotal),
    montos: montosDe(f),
    conRetenciones: c.retencionIsr + c.retencionIva > 0n,
    categoria: recordada?.categoria ?? null,
    proyecto: recordada?.projectId ?? '',
    nota:
      recordada === null
        ? 'Elige una; la recordamos para este RFC.'
        : 'Como sus facturas anteriores.',
  };
}

const FECHA = /^(\d{4})-(\d{2})-\d{2}$/;

/** The month after a payment date, «noviembre»; null while the date is incomplete. */
function mesSiguiente(fecha: string): string | null {
  const m = FECHA.exec(fecha);
  if (m === null) return null;
  const mes = Number(m[2]);
  if (mes < 1 || mes > 12) return null;
  const año = mes === 12 ? Number(m[1]) + 1 : Number(m[1]);
  const siguiente = mes === 12 ? 1 : mes + 1;
  return formatMonth(`${año}-${String(siguiente).padStart(2, '0')}`).split(' ')[0] ?? null;
}

/** Withholdings are owed to the SAT, not spent, and paid with the next month's declaration. */
export function notaRetenciones(fecha: string, pagada: boolean): string {
  const base = 'Las retenciones no son gasto: MEXIA las';
  if (!pagada) return `${base} deberá al SAT cuando pague la factura.`;
  const mes = mesSiguiente(fecha);
  return `${base} debe al SAT y las paga con la declaración del ${mes === null ? 'mes siguiente' : `17 de ${mes}`}.`;
}

/** One attached XML that cannot be registered: the review's label and reason, in one line. */
export function mensajeDeRechazo(r: Rechazo): string {
  const f = fueraDe(r);
  return `${f.etiqueta}. ${f.texto}`;
}
