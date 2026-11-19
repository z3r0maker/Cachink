import { formatMoney } from '@xangarro/domain';
import { totalDeclarado, type Comparacion } from '@xangarro/domain/corp';

import { diasEntre, fechaCorta } from './fechas';
import type { DatosImpuestos, EstadoMes, MesImpuestos } from './impuestos-view';

/**
 * The top of Impuestos' month (E-13, board CD-09): the amount to pay, where
 * the declaration stands, its four steps, and the «Revisa con el contador»
 * warning. Pure.
 */
export type Tono = 'ok' | 'info' | 'warn' | 'bad' | 'off';

export interface Chip {
  readonly texto: string;
  readonly tono: Tono;
}

function plazo(vence: string, hoy: string): Chip {
  const dias = diasEntre(hoy, vence);
  if (dias < 0) return { texto: `Venció el ${fechaCorta(vence)}`, tono: 'bad' };
  if (dias === 0) return { texto: 'Vence hoy', tono: 'warn' };
  if (dias === 1) return { texto: 'Vence mañana', tono: 'warn' };
  return { texto: `Vence el ${fechaCorta(vence)} · faltan ${dias} días`, tono: 'off' };
}

export function chipDelMes(m: MesImpuestos, hoy: string): Chip {
  const textos: Record<Exclude<EstadoMes, 'por_declarar'>, Chip> = {
    diferencia: { texto: 'Revisa con el contador', tono: 'warn' },
    preparada: { texto: 'Falta el acuse', tono: 'info' },
    presentada: { texto: 'Presentada · falta el pago', tono: 'info' },
    pagada: m.obligacion?.sinPago
      ? { texto: 'Presentada en ceros', tono: 'ok' }
      : { texto: 'Pagado', tono: 'ok' },
  };
  return m.estado === 'por_declarar' ? plazo(m.vence, hoy) : textos[m.estado];
}

export interface Hero {
  readonly etiqueta: string;
  readonly total: string;
  readonly texto: string;
}

export function heroDe(m: MesImpuestos, d: DatosImpuestos): Hero {
  const dec = m.declaracion;
  const e = m.estimado;
  const etiqueta =
    m.estado === 'pagada'
      ? d.pago === null
        ? 'Declarada en ceros'
        : `Pagado el ${fechaCorta(d.pago.fecha)}`
      : `${dec === null ? 'Estimado' : 'Declarado'} a pagar el ${fechaCorta(m.vence)}`;
  const isr = dec?.isr ?? e.isr.aPagar;
  const iva = dec?.iva ?? e.iva.aPagar;
  const ret = dec === null ? e.retenciones.total : dec.retencionIsr + dec.retencionIva;
  const texto =
    m.estado === 'diferencia'
      ? `Lo que declaró el contador. El estimado es ${formatMoney(e.total)}.`
      : `ISR ${formatMoney(isr)} · IVA ${formatMoney(iva)} · Retenciones ${formatMoney(ret)}`;
  return { etiqueta, total: formatMoney(dec === null ? e.total : totalDeclarado(dec)), texto };
}

export interface Paso {
  readonly n: string;
  readonly titulo: string;
  readonly sub: string;
  readonly hecho: boolean;
  readonly aviso: boolean;
}

const subido = (d: DatosImpuestos, tipo: string) =>
  d.papeles.find((p) => p.tipo === tipo)?.subidoEn.slice(0, 10) ?? null;

export function pasosDe(m: MesImpuestos, d: DatosImpuestos): readonly Paso[] {
  const presentada = m.estado === 'pagada' || m.obligacion?.estado === 'presentada';
  const acuse = subido(d, 'acuse');
  const contador =
    m.declaracion === null
      ? 'Captúralas cuando las mande'
      : m.estado === 'diferencia'
        ? 'No coinciden con el estimado'
        : 'Coinciden con el estimado';
  const pago =
    m.estado !== 'pagada'
      ? 'Para marcarla pagada'
      : d.pago === null
        ? 'En ceros: sin pago'
        : `Pagado el ${fechaCorta(d.pago.fecha)}`;
  return [
    { n: '1', titulo: 'Estimado', sub: 'Sale de los movimientos', hecho: true, aviso: false },
    {
      n: '2',
      titulo: 'Cifras del contador',
      sub: contador,
      hecho: m.declaracion !== null,
      aviso: m.estado === 'diferencia',
    },
    {
      n: '3',
      titulo: 'Acuse y línea de captura',
      sub: presentada && acuse !== null ? `Presentada el ${fechaCorta(acuse)}` : 'Al presentarla',
      hecho: presentada,
      aviso: false,
    },
    {
      n: '4',
      titulo: 'Comprobante de pago',
      sub: pago,
      hecho: m.estado === 'pagada',
      aviso: false,
    },
  ];
}

export interface AvisoDiferencia {
  readonly titulo: string;
  readonly texto: string;
}

const NOMBRES = { isr: 'el ISR', iva: 'el IVA', retenciones: 'las retenciones' } as const;
const absoluto = (v: bigint) => (v < 0n ? -v : v);

/** The taxes whose declared figure is more than $1 away from the estimate. */
export function avisoDiferencia(m: MesImpuestos): AvisoDiferencia | null {
  const c = m.comparacion;
  const malas = (['isr', 'iva', 'retenciones'] as const).filter((k) => c[k].revisar);
  if (malas.length === 0) return null;
  const linea = (k: (typeof malas)[number], x: Comparacion) =>
    `En ${NOMBRES[k]} declaró ${formatMoney(x.declarado ?? 0n)} y aquí sale ${formatMoney(x.estimado)}.`;
  const [una] = malas;
  const titulo =
    malas.length === 1 && una !== undefined
      ? `Revisa con el contador: ${NOMBRES[una]} no coincide por ${formatMoney(absoluto(c[una].diferencia ?? 0n))}`
      : `Revisa con el contador: ${malas.map((k) => NOMBRES[k]).join(' y ')} no coinciden`;
  const texto = `${malas.map((k) => linea(k, c[k])).join(' ')} Suele ser un movimiento que aquí falta o que él clasificó distinto.`;
  return { titulo, texto };
}
