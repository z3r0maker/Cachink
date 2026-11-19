import { formatMoney } from '@xangarro/domain';
import type { Comparacion, EstimadoDelMes } from '@xangarro/domain/corp';

import { nombreMes } from './fechas';
import type { MesImpuestos } from './impuestos-view';

/**
 * Impuestos' three cards (E-13, board CD-09): each tax's working, then the
 * estimate, the contador's figure and the difference. A line opens the
 * month's movements it comes from. Retenciones shows only in a month that
 * has any. Pure.
 */
export interface LineaTarjeta {
  readonly label: string;
  readonly monto: string;
  readonly negativo: boolean;
  readonly href: string;
}

export interface Tarjeta {
  readonly id: 'isr' | 'iva' | 'retenciones';
  readonly titulo: string;
  readonly sub: string;
  readonly lineas: readonly LineaTarjeta[];
  readonly resultadoLabel: string;
  readonly resultado: string;
  readonly nota: string;
  readonly estimado: string;
  readonly contador: string;
  readonly diferencia: string;
  readonly difTono: 'ok' | 'warn' | 'off';
}

const ver = (mes: string, que: 'ingresos' | 'gastos' | 'todos') =>
  `/empresa/movimientos?mes=${mes}&ver=${que}`;

const linea = (label: string, monto: bigint, href: string): LineaTarjeta => ({
  label,
  monto: formatMoney(monto),
  negativo: monto < 0n,
  href,
});

function columnas(c: Comparacion) {
  const d = c.diferencia;
  const signo = d !== null && d > 0n ? '+' : '';
  return {
    estimado: formatMoney(c.estimado),
    contador: c.declarado === null ? '—' : formatMoney(c.declarado),
    diferencia: d === null ? '—' : d === 0n ? '✓ $0.00' : `${signo}${formatMoney(d)}`,
    difTono: d === null ? ('off' as const) : c.revisar ? ('warn' as const) : ('ok' as const),
  };
}

function isr(e: EstimadoDelMes, mes: string, c: Comparacion): Tarjeta {
  const i = e.isr;
  return {
    id: 'isr',
    titulo: 'ISR provisional',
    sub: `RESICO persona moral · lo acumulado de enero a ${nombreMes(mes)}`,
    lineas: [
      linea('Ingresos cobrados en el año', i.ingresosAnio, ver(mes, 'ingresos')),
      linea('− Deducciones pagadas en el año', i.deduccionesAnio, ver(mes, 'gastos')),
      linea('= Utilidad del año', i.utilidad, ver(mes, 'todos')),
      linea('ISR del año (30 %)', i.causado, ver(mes, 'todos')),
      linea('− Pagos provisionales anteriores', i.pagosAnteriores, ver(mes, 'todos')),
    ],
    resultadoLabel: 'A pagar',
    resultado: formatMoney(i.aPagar),
    nota:
      i.utilidad <= 0n
        ? 'Con pérdida en el año el pago es $0.00, pero se declara.'
        : 'El 30 % de la utilidad del año, menos lo ya pagado este año.',
    ...columnas(c),
  };
}

function iva(e: EstimadoDelMes, mes: string, c: Comparacion): Tarjeta {
  const v = e.iva;
  const lineas = [
    linea('IVA trasladado cobrado', v.trasladado, ver(mes, 'ingresos')),
    linea('− IVA acreditable pagado', v.acreditable, ver(mes, 'gastos')),
  ];
  if (v.aFavorAnterior > 0n) {
    lineas.push(linea('− Saldo a favor de meses anteriores', v.aFavorAnterior, ver(mes, 'todos')));
  }
  return {
    id: 'iva',
    titulo: 'IVA del mes',
    sub: `Lo cobrado y lo pagado en ${nombreMes(mes)}`,
    lineas,
    resultadoLabel: v.aFavor > 0n ? 'A favor' : 'A pagar',
    resultado: formatMoney(v.aFavor > 0n ? v.aFavor : v.aPagar),
    nota:
      v.aFavor > 0n
        ? 'Se acredita en los meses siguientes.'
        : 'Si saliera negativo, es IVA a favor y se acredita en los meses siguientes.',
    ...columnas(c),
  };
}

function retenciones(e: EstimadoDelMes, mes: string, c: Comparacion): Tarjeta {
  const r = e.retenciones;
  return {
    id: 'retenciones',
    titulo: 'Retenciones',
    sub: 'Lo que retuvimos a proveedores',
    lineas: [
      linea('ISR retenido', r.isr, ver(mes, 'gastos')),
      linea('IVA retenido', r.iva, ver(mes, 'gastos')),
    ],
    resultadoLabel: 'A pagar',
    resultado: formatMoney(r.total),
    nota: 'Se pagan en la misma declaración.',
    ...columnas(c),
  };
}

export function tarjetasDe(m: MesImpuestos): readonly Tarjeta[] {
  const { estimado: e, comparacion: c } = m;
  const conRetenciones = e.retenciones.total !== 0n || (c.retenciones.declarado ?? 0n) !== 0n;
  return [
    isr(e, m.mes, c.isr),
    iva(e, m.mes, c.iva),
    ...(conRetenciones ? [retenciones(e, m.mes, c.retenciones)] : []),
  ];
}
