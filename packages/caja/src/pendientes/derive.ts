import { formatMoney, sum, type Money } from '@xangarro/domain';

import type { RegistroEnCola } from './types';

export type Fase = 'espera' | 'enviando' | 'enviado';

export const fase = (cola: readonly RegistroEnCola[], enviando: boolean): Fase => {
  if (enviando) return 'enviando';
  return cola.length === 0 ? 'enviado' : 'espera';
};

const conMonto = (rs: readonly RegistroEnCola[]): readonly Money[] =>
  rs.flatMap((r) => (r.monto === null ? [] : [r.monto]));

/** «Suman $283.00 de ventas y un gasto de $620.00.»: the file's one case, generalised. */
export function suman(cola: readonly RegistroEnCola[]): string {
  const hayVentas = cola.some((r) => r.tipo === 'venta');
  const ventas = sum(conMonto(cola.filter((r) => r.tipo === 'venta')));
  const gastos = cola.filter((r) => r.tipo === 'gasto');
  if (!hayVentas && gastos.length === 0) return '';
  const total = formatMoney(sum(conMonto(gastos)));
  const g =
    gastos.length === 0
      ? ''
      : gastos.length === 1
        ? `un gasto de ${total}`
        : `${gastos.length} gastos por ${total}`;
  if (!hayVentas) return `Suman ${g}.`;
  return `Suman ${formatMoney(ventas)} de ventas${g ? ` y ${g}` : ''}.`;
}

export interface Heroe {
  readonly eyebrow: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly boton: string;
}

export function heroe(f: Fase, cola: readonly RegistroEnCola[], enCola: number): Heroe {
  if (f === 'enviando') {
    return {
      eyebrow: 'Enviando',
      titulo: enCola === 1 ? 'Enviando 1 registro…' : `Enviando ${enCola} registros…`,
      cuerpo: 'No cierres la pestaña. En cuanto suban, el turno se puede cerrar.',
      boton: 'Enviando…',
    };
  }
  if (f === 'enviado') {
    return {
      eyebrow: 'Al día',
      titulo: 'Todo enviado',
      cuerpo: 'El último envío fue hace unos segundos.',
      boton: 'Revisar de nuevo',
    };
  }
  return {
    eyebrow: 'Sin conexión',
    titulo:
      cola.length === 1
        ? '1 registro espera conexión'
        : `${cola.length} registros esperan conexión`,
    cuerpo:
      `${suman(cola)} Puedes seguir cobrando; se envían solos cuando vuelva el internet.`.trim(),
    boton: 'Reintentar ahora',
  };
}

/** «el portal de Pedro»; a linked caja doesn't know the owner's name: «el portal del dueño». */
export const portalDe = (dueno: string | null): string =>
  dueno === null ? 'el portal del dueño' : `el portal de ${dueno}`;

export const intro = (vacia: boolean, dueno: string | null = 'Pedro'): string =>
  vacia ? `Tu caja está al día con ${portalDe(dueno)}` : 'Lo que capturaste sin internet';

/** Row chip: sending, waiting for a connection, or just queued. */
export function estadoFila(
  f: Fase,
  offline: boolean,
): 'Enviando' | 'Esperando conexión' | 'En cola' {
  if (f === 'enviando') return 'Enviando';
  return offline ? 'Esperando conexión' : 'En cola';
}
