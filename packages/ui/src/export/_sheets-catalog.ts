/**
 * Catalog-entity sheets: Productos, Empleados, Clientes, Recurrentes.
 * Split out of `build-excel-sheets.ts` (Slice 3 C23) to respect the
 * 200-line file budget.
 */

import type ExcelJS from 'exceljs';
import type { ExportDataset } from '@cachink/application';
import { DATE_FORMAT, MONEY_FORMAT, centavosToPesos } from './_sheets-shared';

export function addProductosSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Productos');
  sheet.columns = [
    { header: 'Nombre', key: 'nombre', width: 28 },
    { header: 'SKU', key: 'sku', width: 18 },
    { header: 'Categoría', key: 'categoria', width: 18 },
    { header: 'Unidad', key: 'unidad', width: 10 },
    { header: 'Costo unit. (MXN)', key: 'costoUnit', width: 16, style: { numFmt: MONEY_FORMAT } },
    { header: 'Umbral stock bajo', key: 'umbral', width: 16 },
  ];
  for (const p of ds.products) {
    sheet.addRow({
      nombre: p.nombre,
      sku: p.sku ?? '',
      categoria: p.categoria,
      unidad: p.unidad,
      costoUnit: centavosToPesos(p.costoUnitCentavos),
      umbral: p.umbralStockBajo,
    });
  }
}

export function addEmpleadosSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Empleados');
  sheet.columns = [
    { header: 'Nombre', key: 'nombre', width: 28 },
    { header: 'Puesto', key: 'puesto', width: 20 },
    { header: 'Salario (MXN)', key: 'salario', width: 16, style: { numFmt: MONEY_FORMAT } },
    { header: 'Periodo', key: 'periodo', width: 14 },
  ];
  for (const e of ds.employees) {
    sheet.addRow({
      nombre: e.nombre,
      puesto: e.puesto,
      salario: centavosToPesos(e.salarioCentavos),
      periodo: e.periodo,
    });
  }
}

export function addClientesSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Clientes');
  sheet.columns = [
    { header: 'Nombre', key: 'nombre', width: 28 },
    { header: 'Teléfono', key: 'telefono', width: 16 },
    { header: 'Correo', key: 'email', width: 28 },
    { header: 'Nota', key: 'nota', width: 36 },
  ];
  for (const c of ds.clients) {
    sheet.addRow({
      nombre: c.nombre,
      telefono: c.telefono ?? '',
      email: c.email ?? '',
      nota: c.nota ?? '',
    });
  }
}

export function addRecurrentesSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Recurrentes');
  sheet.columns = [
    { header: 'Concepto', key: 'concepto', width: 28 },
    { header: 'Frecuencia', key: 'frecuencia', width: 14 },
    { header: 'Monto (MXN)', key: 'monto', width: 14, style: { numFmt: MONEY_FORMAT } },
    { header: 'Próximo disparo', key: 'proximo', width: 18, style: { numFmt: DATE_FORMAT } },
  ];
  for (const r of ds.recurringExpenses) {
    sheet.addRow({
      concepto: r.concepto,
      frecuencia: r.frecuencia,
      monto: centavosToPesos(r.montoCentavos),
      proximo: r.proximoDisparo,
    });
  }
}
