/**
 * Shared helpers + cover sheet (Slice 3 C23). Split out of
 * `build-excel-sheets.ts` to respect the 200-line file budget.
 */

import type ExcelJS from 'exceljs';
import type { ExportDataset } from '@cachink/application';
import type { Money } from '@cachink/domain';

/** ES-MX currency format applied to every monetary column. */
export const MONEY_FORMAT = '"$"#,##0.00';
export const DATE_FORMAT = 'yyyy-mm-dd';

/**
 * Centavos → pesos number. Loses precision above ~$90 trillion MXN
 * (Number.MAX_SAFE_INTEGER / 100); the 10-trillion-peso sentinel test
 * in `./build-excel.test.ts` pins the safe bound.
 */
export function centavosToPesos(centavos: Money): number {
  return Number(centavos) / 100;
}

export function addCoverSheet(
  wb: ExcelJS.Workbook,
  dataset: ExportDataset,
  exportedAt: Date,
): void {
  const sheet = wb.addWorksheet('Resumen');
  sheet.columns = [
    { header: 'Campo', key: 'campo', width: 26 },
    { header: 'Valor', key: 'valor', width: 40 },
  ];
  const biz = dataset.business;
  sheet.addRow({ campo: 'Negocio', valor: biz?.nombre ?? '—' });
  sheet.addRow({ campo: 'Régimen fiscal', valor: biz?.regimenFiscal ?? '—' });
  sheet.addRow({ campo: 'Tasa de ISR', valor: biz?.isrTasa ?? '—' });
  sheet.addRow({ campo: 'Exportado', valor: exportedAt.toISOString() });
  sheet.addRow({ campo: 'Ventas', valor: dataset.sales.length });
  sheet.addRow({ campo: 'Egresos', valor: dataset.expenses.length });
  sheet.addRow({ campo: 'Productos', valor: dataset.products.length });
  sheet.addRow({ campo: 'Movimientos', valor: dataset.inventoryMovements.length });
  sheet.addRow({ campo: 'Empleados', valor: dataset.employees.length });
  sheet.addRow({ campo: 'Clientes', valor: dataset.clients.length });
  sheet.addRow({ campo: 'Pagos', valor: dataset.clientPayments.length });
  sheet.addRow({ campo: 'Cortes', valor: dataset.dayCloses.length });
  sheet.addRow({ campo: 'Gastos recurrentes', valor: dataset.recurringExpenses.length });
}
