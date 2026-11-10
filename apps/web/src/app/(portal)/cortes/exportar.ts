import { toPesosString } from '@xangarro/domain';

import { csvLine, csvNumber, csvText } from '@/lib/csv-write';

import { contado, diferencia, esperado } from './derive';
import type { Corte, EstadoCorte } from './types';

/**
 * One corte as a CSV row. The operator's name, the register's, the motivo and
 * the nota were typed on a device, so they are text and can never run as a
 * formula in the owner's spreadsheet (audit F-15a); the three amounts are the
 * app's own arithmetic and stay numbers, the shortfall's minus included.
 */
function fila(c: Corte, estado: EstadoCorte): string {
  const d = diferencia(c);
  const signo = d.tipo === 'falta' ? '-' : '';
  return csvLine([
    csvText(c.operador),
    csvText(c.caja),
    csvText(c.dia),
    csvText(c.horario),
    csvNumber(toPesosString(esperado(c))),
    csvNumber(toPesosString(contado(c))),
    csvNumber(`${signo}${toPesosString(d.monto)}`),
    csvText(estado),
    csvText(c.motivo ?? ''),
    csvText(c.nota ?? ''),
  ]);
}

/** «Exportar mes»: the month's cortes as a CSV in pesos, downloaded on this device. */
export function exportarCortes(cortes: readonly Corte[], estado: (c: Corte) => EstadoCorte): void {
  const csv = [
    'Operador,Caja,Día,Horario,Esperado,Contado,Diferencia,Estado,Motivo,Nota',
    ...cortes.map((c) => fila(c, estado(c))),
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'cortes-del-mes.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
