import type { EstadosModel } from '@/server/estados';

import type { StatementLine } from './statement';

/**
 * The statement line lists.
 *
 * Data, not components — which keeps the screen functions short and makes the
 * plain-language subtitles reviewable in one place. Every subtitle is the copy
 * from the design brief: the explanation beneath each number is the brand trait
 * that makes these statements usable by someone who is not finance-literate.
 */
const partidas = (ps: EstadosModel['desglose']['ingresos']) =>
  ps.map((p) => ({ label: p.clave, amount: p.monto }));

const hastaUtilidadBruta = (
  ER: EstadosModel['resultados'],
  D: EstadosModel['desglose'],
): readonly StatementLine[] => [
  {
    label: 'Ingresos',
    subtitle: 'Todo el dinero que entró por ventas',
    amount: ER.ingresos,
    detalle: partidas(D.ingresos),
  },
  {
    label: 'Costo de ventas',
    subtitle: 'Lo que gastaste para producir lo que vendiste',
    amount: ER.costoDeVentas,
    negative: true,
    detalle: partidas(D.costoDeVentas),
  },
  {
    label: 'Utilidad bruta',
    subtitle: 'Lo que te queda después del costo del producto',
    amount: ER.utilidadBruta,
    total: true,
  },
];

const desdeGastos = (
  ER: EstadosModel['resultados'],
  D: EstadosModel['desglose'],
): readonly StatementLine[] => [
  {
    label: 'Gastos operativos',
    subtitle: 'Gastos para mantener el negocio andando',
    amount: ER.gastosOperativos,
    negative: true,
    detalle: partidas(D.gastosOperativos),
  },
  {
    label: 'Utilidad operativa',
    subtitle: 'Lo que queda después de TODOS los gastos',
    amount: ER.utilidadOperativa,
    total: true,
  },
  {
    label: 'ISR',
    subtitle: 'Impuesto sobre la renta (estimado)',
    amount: ER.isr,
    negative: true,
  },
  {
    label: 'Utilidad neta',
    subtitle: 'Lo que realmente te queda al final',
    amount: ER.utilidadNeta,
    total: true,
  },
];

/** NIF B-3 top to bottom: the gross half, then expenses down to utilidad neta. */
export const resultadosLines = (
  ER: EstadosModel['resultados'],
  D: EstadosModel['desglose'],
): readonly StatementLine[] => [...hastaUtilidadBruta(ER, D), ...desdeGastos(ER, D)];

export const activoLines = (BALANCE: EstadosModel['balance']): readonly StatementLine[] => [
  { label: 'Efectivo', subtitle: 'Dinero en caja y banco', amount: BALANCE.activo.efectivo },
  {
    label: 'Inventarios',
    subtitle: 'Valor del producto que tienes para vender',
    amount: BALANCE.activo.inventarios,
  },
  {
    label: 'Cuentas por cobrar',
    subtitle: 'Lo que te deben los clientes',
    amount: BALANCE.activo.cuentasPorCobrar,
  },
  { label: 'Total activo', amount: BALANCE.activo.total, total: true },
];

export const pasivoLines = (BALANCE: EstadosModel['balance']): readonly StatementLine[] => [
  {
    label: 'Pasivo',
    subtitle: 'Lo que tu negocio le debe a otros',
    amount: BALANCE.pasivo.total,
  },
  { label: 'Utilidad del periodo', amount: BALANCE.capital.utilidadDelPeriodo },
  { label: 'Total capital', amount: BALANCE.capital.total, total: true },
];

export const flujoLines = (FLUJO: EstadosModel['flujo']): readonly StatementLine[] => [
  { label: 'Cobros de ventas de contado', amount: FLUJO.cobroVentasContado },
  { label: 'Cobros de crédito a clientes', amount: FLUJO.cobroCreditoClientes },
  { label: 'Gastos operativos', amount: FLUJO.egresoOperativo, negative: true },
  { label: 'Flujo de operación', amount: FLUJO.operacion, total: true },
  {
    label: 'Compras de inventario',
    subtitle: 'Es normal que sea negativo.',
    amount: FLUJO.egresoInversion,
    negative: true,
  },
  { label: 'Flujo de inversión', amount: FLUJO.inversion, total: true },
  { label: 'Incremento neto en efectivo', amount: FLUJO.total, total: true },
];
