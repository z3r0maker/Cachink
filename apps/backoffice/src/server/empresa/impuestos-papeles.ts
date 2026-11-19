import { formatMoney } from '@xangarro/domain';
import { lineaCuadra, totalDeclarado, type TipoEvidencia } from '@xangarro/domain/corp';

import { fechaCorta, nombreMes } from './fechas';
import type { Chip } from './impuestos-encabezado';
import { mesDe, hrefImpuestos, type DatosImpuestos, type MesImpuestos } from './impuestos-view';

/**
 * The bottom of Impuestos' month (E-13, board CD-09): its three papers, when
 * «Marcar como pagado» is allowed and why not, and the year's earlier months.
 * Pure.
 */
export interface Papel {
  readonly tipo: TipoEvidencia;
  readonly nombre: string;
  readonly detalle: string;
  /** Set when the línea's amount is not what was declared. */
  readonly aviso: string | null;
  readonly documentoId: string | null;
  readonly puedeSubir: boolean;
}

const ESPERA: Record<'acuse' | 'linea_captura' | 'comprobante_pago', [string, string]> = {
  acuse: ['Acuse de la declaración', 'Lo manda el contador al presentarla'],
  linea_captura: ['Línea de captura', 'Con el importe a pagar y su vigencia'],
  comprobante_pago: ['Comprobante de pago', 'El recibo del banco al pagar'],
};

function detalleLinea(m: MesImpuestos, nombre: string): string {
  const d = m.declaracion;
  if (d?.lineaImporte == null) return nombre;
  const vigencia =
    d.lineaVigencia === null ? '' : ` · vigente hasta el ${fechaCorta(d.lineaVigencia)}`;
  return `${formatMoney(d.lineaImporte)}${vigencia}`;
}

export function papelesDe(m: MesImpuestos, d: DatosImpuestos): readonly Papel[] {
  return (Object.keys(ESPERA) as (keyof typeof ESPERA)[]).map((tipo) => {
    const [nombre, espera] = ESPERA[tipo];
    const doc = d.papeles.find((p) => p.tipo === tipo) ?? null;
    const subido = doc === null ? null : `${doc.nombre} · ${fechaCorta(doc.subidoEn.slice(0, 10))}`;
    const dec = m.declaracion;
    const descuadre = tipo === 'linea_captura' && dec !== null && !lineaCuadra(dec) ? dec : null;
    return {
      tipo,
      nombre,
      detalle:
        subido === null ? espera : tipo === 'linea_captura' ? detalleLinea(m, subido) : subido,
      aviso:
        descuadre === null
          ? null
          : `No es la suma declarada (${formatMoney(totalDeclarado(descuadre))}).`,
      documentoId: doc?.id ?? null,
      puedeSubir: m.estado !== 'pagada',
    };
  });
}

export interface Pago {
  readonly puede: boolean;
  /** The month is pagada: nothing is left to mark. */
  readonly cerrado: boolean;
  /** A ledger entry paid it (a month en ceros has none). */
  readonly pagado: boolean;
  readonly texto: string;
}

function pagoCerrado(d: DatosImpuestos): Pago {
  return {
    puede: false,
    cerrado: true,
    pagado: d.pago !== null,
    texto:
      d.pago === null
        ? 'Declarada en ceros: no hubo nada que pagar.'
        : 'El pago quedó en Movimientos como «Pago de impuestos», con el comprobante.',
  };
}

/** Why «Marcar como pagado» waits, or what it will do once it may be pressed. */
function textoDelPago(m: MesImpuestos, puede: boolean, total: bigint): string {
  if (m.declaracion === null) return 'Primero captura lo que declaró el contador.';
  if (m.obligacion?.estado !== 'presentada') return 'Para marcarla pagada, primero sube el acuse.';
  if (!puede) return 'Sube el comprobante para marcarla pagada.';
  if (total === 0n) return 'Declarada en ceros: se cierra sin pago.';
  return `Al marcarla, se registra el pago de ${formatMoney(total)} en Movimientos.`;
}

export function pagoDe(m: MesImpuestos, d: DatosImpuestos): Pago {
  if (m.estado === 'pagada') return pagoCerrado(d);
  const dec = m.declaracion;
  const total = dec === null ? 0n : totalDeclarado(dec);
  const conComprobante = d.papeles.some((p) => p.tipo === 'comprobante_pago');
  const puede =
    dec !== null && m.obligacion?.estado === 'presentada' && (conComprobante || total === 0n);
  return { puede, cerrado: false, pagado: false, texto: textoDelPago(m, puede, total) };
}

export interface MesAnterior {
  readonly mes: string;
  readonly href: string;
  readonly nombre: string;
  readonly detalle: string;
  readonly total: string;
  readonly chip: Chip;
}

function chipAnterior(m: MesImpuestos, hoy: string): Chip {
  if (m.estado === 'pagada')
    return m.obligacion?.sinPago
      ? { texto: 'En ceros', tono: 'off' }
      : { texto: 'Pagado', tono: 'ok' };
  if (m.estado === 'presentada') return { texto: 'Falta el pago', tono: 'info' };
  if (m.estado === 'preparada') return { texto: 'Falta el acuse', tono: 'info' };
  if (m.estado === 'diferencia') return { texto: 'Revisa', tono: 'warn' };
  return m.vence < hoy ? { texto: 'Vencida', tono: 'bad' } : { texto: 'Por declarar', tono: 'off' };
}

/** The year's months before the one on screen, newest first. */
export function mesesAnteriores(d: DatosImpuestos): readonly MesAnterior[] {
  const anio = d.mes.slice(0, 4);
  return d.estimados
    .filter((e) => e.mes < d.mes && e.mes.startsWith(anio))
    .reverse()
    .flatMap((e) => {
      const m = mesDe(d, e.mes);
      if (m === null) return [];
      const dec = m.declaracion;
      const cifras = dec ?? { isr: e.isr.aPagar, iva: e.iva.aPagar };
      const ret = dec === null ? e.retenciones.total : dec.retencionIsr + dec.retencionIva;
      const nombre = nombreMes(e.mes);
      return [
        {
          mes: e.mes,
          href: hrefImpuestos(e.mes),
          nombre: nombre.charAt(0).toUpperCase() + nombre.slice(1),
          detalle: `${dec === null ? 'Estimado' : 'Declarado'}: ISR ${formatMoney(cifras.isr)} · IVA ${formatMoney(cifras.iva)} · Retenciones ${formatMoney(ret)}`,
          total: formatMoney(dec === null ? e.total : totalDeclarado(dec)),
          chip: chipAnterior(m, d.hoy),
        },
      ];
    });
}

const PASO_AGENDA = {
  pendiente: 'Pendiente',
  preparada: 'Preparada',
  presentada: 'Presentada',
  pagada: 'Pagada',
} as const;

/** The month's «ISR e IVA» in the Agenda, which these papers move. */
export function enAgenda(m: MesImpuestos): { readonly href: string; readonly texto: string } {
  const paso = PASO_AGENDA[m.obligacion?.estado ?? 'pendiente'];
  return {
    href: `/empresa/agenda/impuestos_mensual/${m.mes}`,
    texto: `En Agenda: ISR e IVA de ${nombreMes(m.mes)} · ${paso}`,
  };
}
