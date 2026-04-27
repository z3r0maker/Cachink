/**
 * buildExcelWorkbook tests (Slice 3 C23).
 *
 * Verifies the workbook structure by loading the produced buffer back
 * through exceljs and inspecting sheets, headers, rows, and money
 * formatting. Keeps the assertion surface behaviour-first without
 * locking in byte layout.
 */

import { describe, expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import type { ExportDataset } from '@cachink/application';
import type {
  BusinessId,
  DayClose,
  DayCloseId,
  DeviceId,
  Employee,
  EmployeeId,
  Expense,
  ExpenseId,
  InventoryMovement,
  InventoryMovementId,
  IsoDate,
  IsoTimestamp,
  Product,
  ProductId,
  RecurringExpense,
  RecurringExpenseId,
  SaleId,
} from '@cachink/domain';
import { buildExcelWorkbook, centavosToPesos } from '../../src/export/build-excel';
import { makeClient, makeClientPayment, makeDayClose, makeSale } from '@cachink/testing';

const BIZ = '01HZ8XQN9GZJXV8AKQ5X0C7BJZ' as BusinessId;
const DEV = '01HZ8XQN9GZJXV8AKQ5X0C7DEV' as DeviceId;
const TS = '2026-04-23T15:00:00.000Z' as IsoTimestamp;

function emptyDataset(): ExportDataset {
  return {
    business: {
      id: BIZ,
      nombre: 'Taquería Test',
      regimenFiscal: 'RESICO',
      isrTasa: 0.3,
      logoUrl: null,
      businessId: BIZ,
      deviceId: DEV,
      createdAt: TS,
      updatedAt: TS,
      deletedAt: null,
    },
    sales: [],
    expenses: [],
    products: [],
    inventoryMovements: [],
    employees: [],
    clients: [],
    clientPayments: [],
    dayCloses: [],
    recurringExpenses: [],
  };
}

function populatedDataset(): ExportDataset {
  return {
    ...emptyDataset(),
    sales: [
      makeSale({
        id: '01JPHKA000000000000000S001' as SaleId,
        concepto: 'Taco',
        monto: 45_000n,
        fecha: '2026-04-24' as IsoDate,
      }),
    ],
    expenses: [
      {
        id: '01JPHKA000000000000000E001' as ExpenseId,
        fecha: '2026-04-24' as IsoDate,
        concepto: 'Renta',
        categoria: 'Renta',
        monto: 200_000n,
        proveedor: null,
        gastoRecurrenteId: null,
        businessId: BIZ,
        deviceId: DEV,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      } as Expense,
    ],
    products: [
      {
        id: '01JPHKA000000000000000P001' as ProductId,
        nombre: 'Tortilla',
        sku: 'TOR-001',
        categoria: 'Producto Terminado',
        costoUnitCentavos: 100n,
        unidad: 'pza',
        umbralStockBajo: 3,
        businessId: BIZ,
        deviceId: DEV,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      } as Product,
    ],
    inventoryMovements: [
      {
        id: '01JPHKA000000000000000M001' as InventoryMovementId,
        productoId: '01JPHKA000000000000000P001' as ProductId,
        fecha: '2026-04-24' as IsoDate,
        tipo: 'entrada',
        cantidad: 10,
        costoUnitCentavos: 100n,
        motivo: 'Compra a proveedor',
        nota: null,
        businessId: BIZ,
        deviceId: DEV,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      } as InventoryMovement,
    ],
    employees: [
      {
        id: '01JPHKA000000000000000Y001' as EmployeeId,
        nombre: 'Luis',
        puesto: 'Cajero',
        salarioCentavos: 800_000n,
        periodo: 'quincenal',
        businessId: BIZ,
        deviceId: DEV,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      } as Employee,
    ],
    clients: [makeClient({ nombre: 'Laura' })],
    clientPayments: [makeClientPayment({})],
    dayCloses: [
      makeDayClose({
        id: '01JPHKA000000000000000D001' as DayCloseId,
        efectivoEsperadoCentavos: 45_000n,
        efectivoContadoCentavos: 45_000n,
        diferenciaCentavos: 0n,
      }) as DayClose,
    ],
    recurringExpenses: [
      {
        id: '01JPHKA000000000000000G001' as RecurringExpenseId,
        concepto: 'Renta mensual',
        categoria: 'Renta',
        montoCentavos: 200_000n,
        proveedor: null,
        frecuencia: 'mensual',
        diaDelMes: 1,
        diaDeLaSemana: null,
        proximoDisparo: '2026-05-01' as IsoDate,
        activo: true,
        businessId: BIZ,
        deviceId: DEV,
        createdAt: TS,
        updatedAt: TS,
        deletedAt: null,
      } as RecurringExpense,
    ],
  };
}

async function readBack(buffer: ArrayBuffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  return wb;
}

describe('centavosToPesos', () => {
  it('converts centavos to pesos with 2-decimal precision', () => {
    expect(centavosToPesos(12_345n)).toBe(123.45);
  });

  it('preserves precision at the 10-trillion-peso sentinel (plan risk #5)', () => {
    // 10 trillion pesos = 10e12 * 100 centavos = 1e15 centavos. That's
    // below Number.MAX_SAFE_INTEGER (~9e15), so precision is preserved.
    const trillion = 1_000_000_000_000n; // 1 trillion centavos = 10 billion pesos
    expect(centavosToPesos(trillion * 10n)).toBe(100_000_000_000);
  });
});

describe('buildExcelWorkbook', () => {
  it('returns an ArrayBuffer and contains every expected sheet', async () => {
    const buffer = await buildExcelWorkbook(emptyDataset());
    const wb = await readBack(buffer);
    const names = wb.worksheets.map((w) => w.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'Resumen',
        'Ventas',
        'Egresos',
        'Productos',
        'Movimientos',
        'Empleados',
        'Clientes',
        'Pagos',
        'Cortes',
        'Recurrentes',
      ]),
    );
  });

  it('puts business metadata on the cover sheet for an empty dataset', async () => {
    const buffer = await buildExcelWorkbook(emptyDataset());
    const wb = await readBack(buffer);
    const cover = wb.getWorksheet('Resumen')!;
    const rows: Array<(string | number)[]> = [];
    cover.eachRow((row) => {
      rows.push((row.values as (string | number)[]).slice(1));
    });
    const negocioRow = rows.find((r) => r[0] === 'Negocio');
    expect(negocioRow?.[1]).toBe('Taquería Test');
  });

  it('adds one row per venta with the formatted Spanish columns', async () => {
    const buffer = await buildExcelWorkbook(populatedDataset());
    const wb = await readBack(buffer);
    const ventas = wb.getWorksheet('Ventas')!;
    const header = (ventas.getRow(1).values as string[]).slice(1);
    expect(header).toEqual([
      'Fecha',
      'Concepto',
      'Categoría',
      'Monto (MXN)',
      'Método',
      'Cliente',
      'Estado',
    ]);
    expect(ventas.rowCount).toBe(2); // header + 1 data row
  });

  it('writes money columns in peso units (not centavos) with $ format', async () => {
    const buffer = await buildExcelWorkbook(populatedDataset());
    const wb = await readBack(buffer);
    const ventas = wb.getWorksheet('Ventas')!;
    // Row 2 is the single Sale row. Column 4 is the Monto (MXN) value.
    const cell = ventas.getRow(2).getCell(4);
    expect(cell.value).toBe(450);
    expect(cell.numFmt).toContain('$');
  });

  it('writes a row per entity in all ten sheets when the dataset is populated', async () => {
    const buffer = await buildExcelWorkbook(populatedDataset());
    const wb = await readBack(buffer);
    const entitySheets = [
      'Ventas',
      'Egresos',
      'Productos',
      'Movimientos',
      'Empleados',
      'Clientes',
      'Pagos',
      'Cortes',
      'Recurrentes',
    ];
    for (const name of entitySheets) {
      const sheet = wb.getWorksheet(name)!;
      expect(sheet.rowCount, `sheet ${name} should have header + data row`).toBe(2);
    }
  });

  it('records the exportedAt timestamp on the workbook metadata', async () => {
    const when = new Date('2026-04-24T08:00:00Z');
    const buffer = await buildExcelWorkbook(emptyDataset(), when);
    const wb = await readBack(buffer);
    expect(wb.creator).toBe('Cachink!');
    expect(wb.created?.toISOString()).toBe('2026-04-24T08:00:00.000Z');
  });
});
