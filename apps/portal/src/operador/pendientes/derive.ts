import { formatMoney, sum } from '@xangarro/domain';

import type { RegistroEnCola } from './types';

export type Fase = 'espera' | 'enviando' | 'enviado';

export const fase = (cola: readonly RegistroEnCola[], enviando: boolean): Fase => {
  if (enviando) return 'enviando';
  return cola.length === 0 ? 'enviado' : 'espera';
};

/** «Suman $283.00 de ventas y un gasto de $620.00.» — the file's one case, generalised. */
export function suman(cola: readonly RegistroEnCola[]): string {
  const ventas = sum(cola.filter((r) => r.tipo === 'venta').map((r) => r.monto));
  const gastos = cola.filter((r) => r.tipo === 'gasto');
  const total = formatMoney(sum(gastos.map((r) => r.monto)));
  const g =
    gastos.length === 0
      ? ''
      : gastos.length === 1
        ? ` y un gasto de ${total}`
        : ` y ${gastos.length} gastos por ${total}`;
  return `Suman ${formatMoney(ventas)} de ventas${g}.`;
}

export interface Heroe {
  readonly titulo: string;
  readonly cuerpo: string;
  readonly boton: string;
}

export function heroe(f: Fase, cola: readonly RegistroEnCola[], enCola: number): Heroe {
  if (f === 'enviando') {
    return {
      titulo: `Enviando ${enCola} registros…`,
      cuerpo: 'No cierres la pestaña. En cuanto suban, el turno se puede cerrar.',
      boton: 'Enviando…',
    };
  }
  if (f === 'enviado') {
    return {
      titulo: 'Todo enviado',
      cuerpo: 'El último envío fue hace unos segundos.',
      boton: 'Revisar de nuevo',
    };
  }
  return {
    titulo: `${cola.length} registros en espera`,
    cuerpo: `${suman(cola)} El turno no se puede cerrar hasta que se envíen.`,
    boton: 'Reintentar envío',
  };
}

export const intro = (vacia: boolean): string =>
  vacia
    ? 'Tu caja está al día con el portal de Pedro.'
    : 'Lo que capturaste sin conexión vive en este navegador hasta que suba. Puedes seguir cobrando mientras tanto.';

/** Row chip: sending, waiting for a connection, or just queued. */
export function estadoFila(
  f: Fase,
  offline: boolean,
): 'Enviando' | 'Esperando conexión' | 'En cola' {
  if (f === 'enviando') return 'Enviando';
  return offline ? 'Esperando conexión' : 'En cola';
}
