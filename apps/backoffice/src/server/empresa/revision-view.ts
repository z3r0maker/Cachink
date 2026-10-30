import type { FacturaRecibida, MotivoRechazo, Rechazo } from '@xangarro/application/corp';
import { formatDate, formatMoney, formatMonth, parseIsoDate, tipoPersona } from '@xangarro/domain';
import {
  mensajeCfdiInvalido,
  type CategoriaGasto,
  type MotivoCfdiInvalido,
} from '@xangarro/domain/corp';

import { fechaCorta } from './fechas';

/**
 * Board CD-06c, «Revisa antes de registrar» (E-11): a card per invoice ready
 * to register, with its category remembered per supplier RFC, and a line per
 * file set aside saying why.
 */
export interface Monto {
  readonly label: string;
  readonly value: string;
}

export interface TarjetaRevision {
  readonly uuid: string;
  readonly proveedor: string;
  readonly sub: string;
  readonly verificada: boolean;
  readonly montos: readonly Monto[];
  /** The supplier's last category, or null when the founder must pick one. */
  readonly categoria: CategoriaGasto | null;
  readonly nota: string;
  /** A project id, or '' for «Compartido». */
  readonly proyecto: string;
}

export type Recordada = { readonly categoria: CategoriaGasto; readonly projectId: string | null };

function montosDe(f: FacturaRecibida): readonly Monto[] {
  const c = f.cfdi;
  const retenciones =
    c.retencionIsr + c.retencionIva === 0n
      ? [{ label: 'Retenciones', value: formatMoney(0n) }]
      : [
          { label: 'ISR retenido', value: formatMoney(c.retencionIsr) },
          { label: 'IVA retenido', value: formatMoney(c.retencionIva) },
        ];
  return [
    { label: 'Subtotal', value: formatMoney(c.subtotal) },
    { label: 'IVA', value: formatMoney(c.iva) },
    ...retenciones,
    { label: c.metodoPago === 'PPD' ? 'Por pagar' : 'Se pagó', value: formatMoney(c.total) },
  ];
}

export function tarjetaDe(f: FacturaRecibida, recordada: Recordada | null): TarjetaRevision {
  const c = f.cfdi;
  const persona = tipoPersona(c.emisor.rfc) === 'fisica' ? 'persona física' : 'persona moral';
  const pago = c.metodoPago === 'PPD' ? 'a crédito (PPD)' : 'pagada (PUE)';
  return {
    uuid: c.uuid,
    proveedor: c.emisor.nombre || c.emisor.rfc,
    sub: [formatDate(parseIsoDate(c.fecha)), `RFC ${c.emisor.rfc}`, persona, pago, f.archivo].join(
      ' · ',
    ),
    verificada: f.estadoSat === 'vigente',
    montos: montosDe(f),
    categoria: recordada?.categoria ?? null,
    nota:
      recordada === null
        ? 'Elige una; la recordamos para este RFC.'
        : 'Como sus facturas anteriores.',
    proyecto: recordada?.projectId ?? '',
  };
}

export type Tono = 'neutro' | 'alerta' | 'aviso';

export interface FueraDeRevision {
  readonly etiqueta: string;
  readonly tono: Tono;
  readonly titulo: string;
  readonly texto: string;
  /** The movement an invoice already posted («Ya registrada»). */
  readonly entryId: string | null;
}

const PROPIOS: Record<
  Exclude<MotivoRechazo, MotivoCfdiInvalido>,
  { etiqueta: string; tono: Tono }
> = {
  ya_registrada: { etiqueta: 'Ya registrada', tono: 'neutro' },
  cancelada: { etiqueta: 'Cancelada', tono: 'alerta' },
  otro_rfc: { etiqueta: 'No es de MEXIA', tono: 'aviso' },
  no_encontrada: { etiqueta: 'No está en el SAT', tono: 'aviso' },
  repetida: { etiqueta: 'Repetida', tono: 'neutro' },
  muy_grande: { etiqueta: 'No es una factura', tono: 'aviso' },
};

function texto(r: Rechazo): string {
  switch (r.motivo) {
    case 'ya_registrada': {
      const mes =
        r.fecha === null ? 'antes' : `de ${formatMonth(r.fecha.slice(0, 7)).split(' ')[0]}`;
      return `Esta factura ya está registrada. Mismo folio fiscal (UUID) que un movimiento ${mes}.`;
    }
    case 'cancelada':
      return 'El SAT la reporta cancelada: no se registra. Queda en la lista de recibidas marcada como cancelada.';
    case 'otro_rfc':
      return 'Está a nombre de otro RFC, no de MEXIA. Pídele al proveedor que la emita a MEXIA, S.A.S.';
    case 'no_encontrada':
      return 'El SAT todavía no la encuentra. Si es reciente, súbela de nuevo en unos días.';
    case 'repetida':
      return 'Subiste el mismo XML dos veces; se toma una sola.';
    case 'muy_grande':
      return 'Pesa más de 1 MB: el XML de una factura pesa unos cuantos KB.';
    default:
      return mensajeCfdiInvalido(r.motivo);
  }
}

const esPropio = (m: MotivoRechazo): m is keyof typeof PROPIOS => m in PROPIOS;

export function fueraDe(r: Rechazo): FueraDeRevision {
  const propio = esPropio(r.motivo) ? PROPIOS[r.motivo] : null;
  return {
    etiqueta: propio?.etiqueta ?? 'No es una factura',
    tono: propio?.tono ?? 'aviso',
    titulo:
      r.proveedor === null || r.fecha === null
        ? r.archivo
        : `${r.proveedor} · ${fechaCorta(r.fecha)}`,
    texto: texto(r),
    entryId: r.motivo === 'ya_registrada' ? r.entryId : null,
  };
}

/**
 * The review's subtitle. Right after an upload it counts the files
 * («Subiste 5 archivos. 2 están listos; 3 no se registran y aquí te decimos
 * por qué.»); coming back later, only what still waits.
 */
export function resumenRevision(listas: number, fuera: number, recienSubidas: boolean): string {
  const facturas = listas === 1 ? '1 factura' : `${listas} facturas`;
  if (!recienSubidas) return `Tienes ${facturas} por registrar.`;
  const total = listas + fuera;
  const subiste = total === 1 ? 'Subiste 1 archivo.' : `Subiste ${total} archivos.`;
  const lista = listas === 1 ? '1 está listo' : `${listas} están listos`;
  if (fuera === 0)
    return `${subiste} ${listas === 1 ? 'Está listo' : 'Todos están listos'} para registrar.`;
  const no = fuera === 1 ? '1 no se registra' : `${fuera} no se registran`;
  return `${subiste} ${lista}; ${no} y aquí te decimos por qué.`;
}

const MOTIVOS: readonly MotivoRechazo[] = [
  'no_es_cfdi',
  'version',
  'no_es_ingreso',
  'complemento_pago',
  'sin_timbre',
  'moneda',
  'importes',
  'muy_grande',
  'repetida',
  'otro_rfc',
  'ya_registrada',
  'no_encontrada',
  'cancelada',
];

const corto = (s: string | null, n: number) => (s === null ? null : s.slice(0, n));

/** The last upload's refusals, for the review page; trimmed to fit a cookie. */
export function serializarRechazos(rechazos: readonly Rechazo[]): string {
  return JSON.stringify(
    rechazos.slice(0, 25).map((r) => ({
      a: r.archivo.slice(0, 60),
      m: r.motivo,
      p: corto(r.proveedor, 60),
      f: r.fecha,
      e: r.entryId,
    })),
  );
}

const cadena = (v: unknown): string | null => (typeof v === 'string' ? v : null);

/** Parsed, never asserted: a cookie is whatever the browser sends back. */
export function leerRechazos(raw: string | undefined): readonly Rechazo[] {
  if (raw === undefined) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  return data.flatMap((d: Record<string, unknown>) => {
    const motivo = MOTIVOS.find((m) => m === d?.m);
    const archivo = cadena(d?.a);
    if (motivo === undefined || archivo === null) return [];
    const fecha = cadena(d.f);
    return [
      {
        archivo,
        motivo,
        proveedor: cadena(d.p),
        fecha: fecha !== null && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : null,
        entryId: cadena(d.e),
      },
    ];
  });
}
