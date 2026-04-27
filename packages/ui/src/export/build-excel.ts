/**
 * buildExcelWorkbook — orchestrator that turns an ExportDataset into
 * an .xlsx ArrayBuffer (P1C-M9-T01, Slice 3 C23).
 *
 * Kept pure (no IO, no fs): the Settings screen owns how the bytes are
 * delivered (share sheet on mobile, download anchor on Tauri web).
 *
 * The per-entity sheet writers live in `./_sheets-*.ts` to respect the
 * 200-line file budget (CLAUDE.md §4.4).
 */

import type ExcelJS from 'exceljs';
import type { ExportDataset } from '@cachink/application';
import {
  addClientesSheet,
  addCortesSheet,
  addCoverSheet,
  addEgresosSheet,
  addEmpleadosSheet,
  addMovimientosSheet,
  addPagosSheet,
  addProductosSheet,
  addRecurrentesSheet,
  addVentasSheet,
} from './build-excel-sheets';

export { centavosToPesos } from './_sheets-shared';

async function loadExcelJs(): Promise<typeof ExcelJS> {
  const mod = await import('exceljs');
  // ESM interop: the package ships as CommonJS and Vite/Metro expose
  // the namespace under `.default`. Fall back to the top-level on
  // platforms that already hoisted the Workbook export.
  const candidate = (mod as unknown as { default?: typeof ExcelJS }).default ?? mod;
  return candidate as typeof ExcelJS;
}

export async function buildExcelWorkbook(
  dataset: ExportDataset,
  exportedAt: Date = new Date(),
): Promise<ArrayBuffer> {
  const ExcelJsNs = await loadExcelJs();
  const wb = new ExcelJsNs.Workbook();
  wb.creator = 'Cachink!';
  wb.lastModifiedBy = 'Cachink!';
  wb.created = exportedAt;
  wb.modified = exportedAt;

  addCoverSheet(wb, dataset, exportedAt);
  addVentasSheet(wb, dataset);
  addEgresosSheet(wb, dataset);
  addProductosSheet(wb, dataset);
  addMovimientosSheet(wb, dataset);
  addEmpleadosSheet(wb, dataset);
  addClientesSheet(wb, dataset);
  addPagosSheet(wb, dataset);
  addCortesSheet(wb, dataset);
  addRecurrentesSheet(wb, dataset);

  return wb.xlsx.writeBuffer();
}
