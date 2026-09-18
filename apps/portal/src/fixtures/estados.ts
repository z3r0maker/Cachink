import {
  calculateBalanceGeneral,
  calculateEstadoDeResultados,
  calculateFlujoDeEfectivo,
  calculateIndicadores,
  type BusinessId,
  type DayClose,
  type DayCloseId,
  type DeviceId,
  type Expense,
  type ExpenseId,
  type IsoDate,
  type IsoTimestamp,
  type ProductId,
  type Sale,
  type SaleId,
} from '@xangarro/domain';

import { pesos } from './business';

/**
 * Period fixtures for Estados financieros.
 *
 * These are real `Sale` and `Expense` values, so the statements are produced by
 * the **existing** `@xangarro/domain` functions rather than by numbers typed
 * into a mock. P-14 says to locate those functions and not reimplement them;
 * this is what makes that verifiable — the same code the phone uses computes
 * what the portal renders.
 */
const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const PROD = '01HZ8XQN9GZJXV8AKQ5X0CPR0D' as ProductId;
const TS = '2026-05-12T15:00:00.000Z' as IsoTimestamp;

let seq = 0;
const id = (p: string): string =>
  `01HZ8XQN9GZJXV8AKQ5X0C${p}${(seq++).toString().padStart(3, '0')}`;

function sale(concepto: string, amount: number, metodo: Sale['metodo'], fecha: string): Sale {
  return {
    id: id('S') as SaleId,
    fecha: fecha as IsoDate,
    concepto,
    categoria: 'Producto',
    monto: pesos(amount),
    metodo,
    cantidad: 1,
    productoId: PROD,
    clienteId: null,
    estadoPago: 'pagado',
    businessId: BIZ,
    deviceId: DEV,
    createdByUserId: null,
    createdAt: TS,
    updatedAt: TS,
    deletedAt: null,
  } as Sale;
}

function expense(concepto: string, amount: number, categoria: Expense['categoria']): Expense {
  return {
    id: id('E') as ExpenseId,
    fecha: '2026-05-08' as IsoDate,
    concepto,
    categoria,
    monto: pesos(amount),
    proveedor: null,
    gastoRecurrenteId: null,
    businessId: BIZ,
    deviceId: DEV,
    createdByUserId: null,
    createdAt: TS,
    updatedAt: TS,
    deletedAt: null,
  } as Expense;
}

export const PERIOD_SALES: readonly Sale[] = [
  sale('Tacos al pastor', 28400, 'Efectivo', '2026-05-04'),
  sale('Quesadillas', 16800, 'Transferencia', '2026-05-07'),
  sale('Gringas', 15600, 'Tarjeta', '2026-05-11'),
  sale('Bebidas', 7620, 'QR/CoDi', '2026-05-12'),
];

export const PERIOD_EXPENSES: readonly Expense[] = [
  expense('Carne y queso', 24610, 'Materia Prima'),
  expense('Refrescos y aguas', 4180, 'Inventario'),
  expense('Nómina semanas 18–21', 16800, 'Nómina'),
  expense('Renta del local', 6000, 'Renta'),
  expense('Luz, gas y agua', 2400, 'Servicios'),
  expense('Empaques', 1800, 'Otro'),
];

/** RESICO — 1.25%, expressed in basis points as the domain requires. */
export const ISR_TASA_BPS = 125;

export const ESTADO_RESULTADOS = calculateEstadoDeResultados({
  ventas: PERIOD_SALES,
  egresos: PERIOD_EXPENSES,
  isrTasa: ISR_TASA_BPS,
});

/**
 * The balance takes the real inputs the domain expects — cortes, stock at cost,
 * credit sales and their payments — not pre-summed totals. Passing totals would
 * have meant reimplementing the aggregation the domain already owns.
 */
export const BALANCE = calculateBalanceGeneral({
  cortesDelDia: [
    {
      id: id('D') as DayCloseId,
      fecha: '2026-05-12' as IsoDate,
      efectivoEsperadoCentavos: pesos(21180),
      efectivoContadoCentavos: pesos(21180),
      diferenciaCentavos: 0n,
      explicacion: null,
      cerradoPor: 'Director',
      businessId: BIZ,
      deviceId: DEV,
      createdByUserId: null,
      createdAt: TS,
      updatedAt: TS,
      deletedAt: null,
    } as DayClose,
  ],
  inventarioStock: [{ costoUnitCentavos: pesos(322), cantidad: 120 }],
  ventasConCredito: [],
  pagosClientes: [],
  pasivosManuales: pesos(12400),
  utilidadDelPeriodo: ESTADO_RESULTADOS.utilidadNeta,
});

export const FLUJO = calculateFlujoDeEfectivo({
  ventas: PERIOD_SALES,
  egresos: PERIOD_EXPENSES,
  pagosClientes: [],
});

export const INDICADORES = calculateIndicadores({
  estadoResultados: ESTADO_RESULTADOS,
  balanceGeneral: BALANCE,
  inventarioPromedio: pesos(9660),
  ventasCreditoPeriodoCentavos: pesos(3940),
  periodoDiasVenta: 31,
});
