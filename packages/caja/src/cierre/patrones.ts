/**
 * The phone's close in its own words (M-16, ADR-147; board MvCierreFlujo):
 * the owner is always «los patrones», never a name, so no test or English
 * name reaches the drawer and the sentence fits any owner. The two steps'
 * titles, the done line, the cash reminder and the corte the operator sends.
 * The web caja keeps `copy.ts`'s named wording until its own canvas round.
 */

import { formatMoney, type DiferenciaCorte, type Money } from '@xangarro/domain';

import { cerrarHint, DIF } from './copy';

export const PATRONES = 'los patrones';

/** Step 2's title, by what the count did. */
export const TITULO_RESULTADO: Readonly<Record<DiferenciaCorte['tipo'], string>> = {
  cuadra: '¡Cuadra!',
  falta: 'Falta efectivo',
  sobra: 'Sobra efectivo',
};

/** Step 2's line under the title; the same hints the difference always said. */
export const pistaResultado = (d: DiferenciaCorte): string => DIF[d.tipo].hint;

/** The note «Otra razón» asks for, and the warning that travels with it. */
export const NOTA_TITULO = `Nota para ${PATRONES}`;
export const NOTA_AVISO = 'Los patrones van a leer esto junto con el corte.';

/** Under «Cerrar turno»: what is missing, or what closing does. */
export function pistaCerrar(faltaMotivo: boolean, faltaNota: boolean): string {
  if (faltaMotivo || faltaNota) return cerrarHint(faltaMotivo, faltaNota);
  return 'Se guarda con tu nombre. Para seguir vendiendo, abres otro turno.';
}

/**
 * The done screen's line: what the count did, and when the owner sees it.
 * «Ya lo tienen» only once a sync run confirmed the close reached the cloud
 * (review M7); until then, when it will. A cuadre thanks the operator.
 */
export function lineaHecho(
  d: DiferenciaCorte,
  motivo: string | null,
  enviado: boolean,
  operador: string,
): string {
  const portal = enviado
    ? 'Los patrones ya lo tienen en su portal.'
    : 'Los patrones lo verán en su portal en cuanto se envíe.';
  if (d.tipo !== 'cuadra') {
    const que = d.tipo === 'falta' ? 'faltante' : 'sobrante';
    return `Quedó un ${que} explicado como «${motivo ?? ''}». ${portal}`;
  }
  const nombre = operador.trim().split(/\s+/)[0] ?? '';
  const gracias = nombre === '' ? 'Gracias por tu turno.' : `Gracias por tu turno, ${nombre}.`;
  return `El conteo cuadró con lo esperado. ${portal} ${gracias}`;
}

/** The reminder on the corte: the counted cash is the owner's. */
export const recordatorioEfectivo = (contado: Money): string =>
  `Guarda ${formatMoney(contado)} para ${PATRONES}.`;

export interface CorteParaMandar {
  readonly negocio?: string;
  readonly caja: string;
  readonly operador: string;
  /** «18 nov». */
  readonly fecha: string;
  readonly desde: string;
  readonly hasta: string;
  readonly contado: Money;
  readonly esperado: Money;
  readonly dif: DiferenciaCorte;
  readonly motivo: string | null;
  readonly ventas: number;
  readonly cobrado: Money;
}

/** The difference's line in the message: «Cuadró al centavo.» or «Faltante: $70.00 (…)». */
function lineaDiferencia(c: CorteParaMandar): string {
  if (c.dif.tipo === 'cuadra') return 'Cuadró al centavo.';
  const que = c.dif.tipo === 'falta' ? 'Faltante' : 'Sobrante';
  const por = c.motivo === null ? '' : ` (${c.motivo})`;
  return `${que}: ${formatMoney(c.dif.monto)}${por}`;
}

/** The corte as the message the owner receives, one fact per line. */
export function mensajeCorte(c: CorteParaMandar): string {
  const ventas = c.ventas === 1 ? '1 venta' : `${c.ventas} ventas`;
  return [
    c.negocio === undefined ? 'Corte de caja' : `Corte de caja · ${c.negocio}`,
    `${c.caja} · ${c.operador} · ${c.fecha}, ${c.desde} a ${c.hasta}`,
    `Contado: ${formatMoney(c.contado)}`,
    `Esperado: ${formatMoney(c.esperado)}`,
    lineaDiferencia(c),
    `${ventas} · Cobrado ${formatMoney(c.cobrado)}`,
  ].join('\n');
}
