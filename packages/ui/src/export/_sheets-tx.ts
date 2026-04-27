/**
 * Transactional-entity sheets: Ventas, Egresos, Movimientos, Pagos,
 * Cortes. Split out of `build-excel-sheets.ts` (Slice 3 C23) to
 * respect the 200-line file budget.
 */

import type ExcelJS from 'exceljs';
import type { ExportDataset } from '@cachink/application';
import { MONEY_FORMAT, centavosToPesos } from './_sheets-shared';

export function addVentasSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Ventas');
  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Concepto', key: 'concepto', width: 32 },
    { header: 'Categoría', key: 'categoria', width: 14 },
    { header: 'Monto (MXN)', key: 'monto', width: 14, style: { numFmt: MONEY_FORMAT } },
    { header: 'Método', key: 'metodo', width: 12 },
    { header: 'Cliente', key: 'clienteId', width: 28 },
    { header: 'Estado', key: 'estadoPago', width: 12 },
  ];
  for (const v of ds.sales) {
    sheet.addRow({
      fecha: v.fecha,
      concepto: v.concepto,
      categoria: v.categoria,
      monto: centavosToPesos(v.monto),
      metodo: v.metodo,
      clienteId: v.clienteId ?? '',
      estadoPago: v.estadoPago,
    });
  }
}

export function addEgresosSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Egresos');
  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Concepto', key: 'concepto', width: 32 },
    { header: 'Categoría', key: 'categoria', width: 14 },
    { header: 'Monto (MXN)', key: 'monto', width: 14, style: { numFmt: MONEY_FORMAT } },
    { header: 'Proveedor', key: 'proveedor', width: 24 },
  ];
  for (const e of ds.expenses) {
    sheet.addRow({
      fecha: e.fecha,
      concepto: e.concepto,
      categoria: e.categoria,
      monto: centavosToPesos(e.monto),
      proveedor: e.proveedor ?? '',
    });
  }
}

export function addMovimientosSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Movimientos');
  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Producto', key: 'productoId', width: 28 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    { header: 'Cantidad', key: 'cantidad', width: 10 },
    { header: 'Costo unit. (MXN)', key: 'costoUnit', width: 16, style: { numFmt: MONEY_FORMAT } },
    { header: 'Motivo', key: 'motivo', width: 28 },
  ];
  for (const m of ds.inventoryMovements) {
    sheet.addRow({
      fecha: m.fecha,
      productoId: m.productoId,
      tipo: m.tipo,
      cantidad: m.cantidad,
      costoUnit: centavosToPesos(m.costoUnitCentavos),
      motivo: m.motivo,
    });
  }
}

export function addPagosSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Pagos');
  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Venta', key: 'ventaId', width: 28 },
    { header: 'Monto (MXN)', key: 'monto', width: 14, style: { numFmt: MONEY_FORMAT } },
    { header: 'Método', key: 'metodo', width: 12 },
  ];
  for (const p of ds.clientPayments) {
    sheet.addRow({
      fecha: p.fecha,
      ventaId: p.ventaId,
      monto: centavosToPesos(p.montoCentavos),
      metodo: p.metodo,
    });
  }
}

export function addCortesSheet(wb: ExcelJS.Workbook, ds: ExportDataset): void {
  const sheet = wb.addWorksheet('Cortes');
  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Esperado (MXN)', key: 'esperado', width: 16, style: { numFmt: MONEY_FORMAT } },
    { header: 'Contado (MXN)', key: 'contado', width: 16, style: { numFmt: MONEY_FORMAT } },
    { header: 'Diferencia (MXN)', key: 'diferencia', width: 16, style: { numFmt: MONEY_FORMAT } },
    { header: 'Explicación', key: 'explicacion', width: 36 },
  ];
  for (const c of ds.dayCloses) {
    sheet.addRow({
      fecha: c.fecha,
      esperado: centavosToPesos(c.efectivoEsperadoCentavos),
      contado: centavosToPesos(c.efectivoContadoCentavos),
      diferencia: centavosToPesos(c.diferenciaCentavos),
      explicacion: c.explicacion ?? '',
    });
  }
}
