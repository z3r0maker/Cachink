import assert from 'node:assert/strict';
import { beforeAll, beforeEach, describe, it, vi } from 'vitest';

import { GET as plantillaClientes } from '../src/app/api/import/clientes/route';
import { GET as plantillaProductos } from '../src/app/api/import/productos/route';
import { parseClientSheet, TEMPLATE_HEADERS as CLIENTES } from '../src/lib/import-clientes';
import { parseProductSheet, TEMPLATE_HEADERS as PRODUCTOS } from '../src/lib/import-productos';
import { buildSheet, loadExcelJs } from '../src/server/export/workbook';
import { readSheet } from '../src/server/import/read-sheet';

/**
 * The Importar templates (P-07, N-16): each route builds its .xlsx from the
 * parser's own `TEMPLATE_HEADERS`, so the one thing worth pinning is that a
 * downloaded template, read back by the upload reader, parses clean — the
 * template and the parser cannot disagree. The E2E suite only ever reaches
 * these routes signed out.
 */

const session = vi.hoisted(() => ({ current: null as object | null }));
vi.mock('../src/server/session', () => ({ readSession: async () => session.current }));

const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

beforeAll(async () => {
  await loadExcelJs();
}, 30_000);

beforeEach(() => {
  session.current = { business_id: 'b1', role: 'owner' };
});

async function tabla(res: Response): Promise<unknown[][]> {
  const bytes = await res.arrayBuffer();
  return readSheet(new File([bytes], 'plantilla.xlsx', { type: XLSX }));
}

describe('GET /api/import/clientes', () => {
  it('downloads a template the Clientes parser reads without a single error', async () => {
    const res = await plantillaClientes();
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('content-type'), XLSX);
    assert.match(res.headers.get('content-disposition') ?? '', /plantilla-clientes\.xlsx/);
    assert.equal(res.headers.get('cache-control'), 'no-store');

    const table = await tabla(res);
    assert.deepEqual(table[0], [...CLIENTES]);
    const parsed = parseClientSheet(table);
    assert.ok(parsed.ok);
    assert.equal(parsed.rows.length, 1);
    assert.deepEqual(parsed.rows[0]?.errors, []);
    assert.equal(parsed.rows[0]?.values?.nombre, 'Doña Mary');
  });

  it('answers 401 without a session, and builds nothing', async () => {
    session.current = null;
    const res = await plantillaClientes();
    assert.equal(res.status, 401);
    assert.deepEqual(await res.json(), { error: 'No autenticado' });
  });
});

describe('GET /api/import/productos', () => {
  it('downloads a template the Productos parser reads, money in centavos', async () => {
    const res = await plantillaProductos();
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-disposition') ?? '', /plantilla-productos\.xlsx/);

    const table = await tabla(res);
    assert.deepEqual(table[0], [...PRODUCTOS]);
    const parsed = parseProductSheet(table);
    assert.ok(parsed.ok);
    assert.deepEqual(parsed.rows[0]?.errors, []);
    assert.equal(parsed.rows[0]?.values?.precioVentaCentavos, 2_800n);
    assert.equal(parsed.rows[0]?.values?.costoUnitCentavos, 1_150n);
  });

  it('answers 401 without a session', async () => {
    session.current = null;
    assert.equal((await plantillaProductos()).status, 401);
  });
});

describe('buildSheet', () => {
  it('writes a bold header, the default width, and one row per record', async () => {
    const at = new Date('2026-05-12T12:00:00.000Z');
    const bytes = await buildSheet(
      'Ventas',
      [
        { header: 'folio', value: (r: { folio: number }) => r.folio },
        { header: 'vacío', value: () => null, width: 30 },
      ],
      [{ folio: 1 }, { folio: 2 }],
      at,
    );
    const ExcelJs = await loadExcelJs();
    const wb = new ExcelJs.Workbook();
    await wb.xlsx.load(bytes);
    const ws = wb.getWorksheet('Ventas');
    assert.ok(ws);
    assert.equal(wb.creator, 'Xangarro');
    assert.equal(ws.getRow(1).font?.bold, true);
    assert.equal(ws.getColumn(1).width, 18);
    assert.equal(ws.getColumn(2).width, 30);
    assert.equal(ws.rowCount, 3);
    assert.equal(ws.getCell('A3').value, 2);
    assert.equal(ws.getCell('B2').value, null);
  });
});
