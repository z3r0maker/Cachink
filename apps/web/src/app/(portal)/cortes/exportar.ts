import { toPesosString } from '@xangarro/domain';

import { contado, diferencia, esperado } from './derive';
import type { Corte, EstadoCorte } from './types';

const celda = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** «Exportar mes»: the month's cortes as a CSV in pesos, downloaded on this device. */
export function exportarCortes(cortes: readonly Corte[], estado: (c: Corte) => EstadoCorte): void {
  const filas = cortes.map((c) => {
    const d = diferencia(c);
    const signo = d.tipo === 'falta' ? '-' : '';
    return [
      c.operador,
      c.caja,
      c.dia,
      c.horario,
      toPesosString(esperado(c)),
      toPesosString(contado(c)),
      `${signo}${toPesosString(d.monto)}`,
      estado(c),
      c.motivo ?? '',
      c.nota ?? '',
    ].map(celda);
  });
  const csv = [
    'Operador,Caja,Día,Horario,Esperado,Contado,Diferencia,Estado,Motivo,Nota',
    ...filas.map((f) => f.join(',')),
  ].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'cortes-del-mes.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
