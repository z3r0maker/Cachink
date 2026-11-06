import assert from 'node:assert/strict';
import { unzipSync, strFromU8 } from 'fflate';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * «Descargar todo»'s .zip: the five workbooks `buildExport` makes for the
 * screens, stored as they come, and `datos.json` spliced from the JSON text
 * Postgres wrote — so a centavos string is still a string when it lands.
 */
const DATASETS = ['ventas', 'gastos', 'productos', 'movimientos', 'empleados'] as const;
const buildExport = vi.fn();
const tablasDelNegocio = vi.fn();
const exportarTabla = vi.fn();

vi.mock('../src/server/export/datasets', () => ({ buildExport, DATASETS }));
vi.mock('@xangarro/data-pg', () => ({ tablasDelNegocio, exportarTabla }));
const withExportTenant = vi.fn((_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true }));
vi.mock('../src/server/db', () => ({ withExportTenant }));

const { buildTodo, fechaMx, slugDe } = await import('../src/server/export/todo');

const tabla = (nombre: string) => ({ nombre, llave: ['id'], omitidas: [], enteros: [] });
const NEGOCIO = '{"id": "biz-1", "nombre": "Taquería Don Pedro"}';
const FILAS: Record<string, readonly (readonly string[])[]> = {
  businesses: [[NEGOCIO]],
  sales: [
    [
      '{"id": "v1", "monto_centavos": "9007199254740993"}',
      '{"id": "v2", "monto_centavos": "2500"}',
    ],
    ['{"id": "v3", "monto_centavos": "100"}'],
  ],
  expenses: [],
};

async function* lotes(nombre: string) {
  for (const l of FILAS[nombre] ?? []) yield l;
}

/** 2026-11-06 03:00 UTC is still the 5th in Mexico City. */
const AHORA = new Date('2026-11-06T03:00:00Z');

async function abrir(body: ReadableStream<Uint8Array>) {
  return unzipSync(new Uint8Array(await new Response(body).arrayBuffer()));
}

beforeEach(() => {
  vi.clearAllMocks();
  tablasDelNegocio.mockResolvedValue(['businesses', 'expenses', 'sales'].map(tabla));
  exportarTabla.mockImplementation((_enTx: unknown, t: { nombre: string }) => lotes(t.nombre));
  buildExport.mockImplementation(async (dataset: string) => ({
    filename: `xangarro-${dataset}.xlsx`,
    body: new Response(`PK-${dataset}`).body,
  }));
});

describe('buildTodo', () => {
  it('zips the five workbooks and datos.json, named for the business and the day in Mexico', async () => {
    const { filename, body } = await buildTodo('biz-1', AHORA);
    assert.equal(filename, 'xangarro-taqueria-don-pedro-2026-11-05.zip');
    const zip = await abrir(body);
    assert.deepEqual(
      Object.keys(zip).sort(),
      ['datos.json', ...DATASETS.map((d) => `${d}.xlsx`).sort()].sort(),
    );
    for (const d of DATASETS) assert.equal(strFromU8(zip[`${d}.xlsx`] as Uint8Array), `PK-${d}`);
    assert.deepEqual(
      buildExport.mock.calls.map((c) => c[0]),
      [...DATASETS],
    );
    assert.ok(buildExport.mock.calls.every((c) => c[1] === 'biz-1'));
  });

  it('writes datos.json as valid JSON: the business, every batch of every table', async () => {
    const zip = await abrir((await buildTodo('biz-1', AHORA)).body);
    const datos = JSON.parse(strFromU8(zip['datos.json'] as Uint8Array)) as {
      exportado: string;
      negocio: { id: string };
      tablas: Record<string, { id: string; monto_centavos?: unknown }[]>;
    };
    assert.equal(datos.exportado, AHORA.toISOString());
    assert.equal(datos.negocio.id, 'biz-1');
    assert.deepEqual(Object.keys(datos.tablas), ['expenses', 'sales']);
    assert.deepEqual(datos.tablas.expenses, []);
    assert.deepEqual(
      datos.tablas.sales?.map((v) => v.id),
      ['v1', 'v2', 'v3'],
    );
  });

  it('keeps money exact: centavos arrive as the strings Postgres wrote, never a float', async () => {
    const zip = await abrir((await buildTodo('biz-1', AHORA)).body);
    const datos = JSON.parse(strFromU8(zip['datos.json'] as Uint8Array)) as {
      tablas: { sales: { monto_centavos: unknown }[] };
    };
    const montos = datos.tablas.sales.map((v) => v.monto_centavos);
    assert.ok(montos.every((m) => typeof m === 'string'));
    assert.equal(BigInt(montos[0] as string), 9_007_199_254_740_993n);
  });

  it('reads through the tenant wrapper of the business it was given', async () => {
    await abrir((await buildTodo('biz-1', AHORA)).body);
    assert.ok(withExportTenant.mock.calls.length > 0);
    assert.ok(withExportTenant.mock.calls.every((c) => c[0] === 'biz-1'));
  });

  it('fails before the stream when the database does, so the route answers with a status', async () => {
    tablasDelNegocio.mockRejectedValue(new Error('connection refused'));
    await assert.rejects(buildTodo('biz-1', AHORA), /connection refused/);
    assert.equal(buildExport.mock.calls.length, 0);
  });

  it('errors the download when a workbook fails halfway, rather than saving half a file', async () => {
    buildExport.mockRejectedValueOnce(new Error('timeout'));
    const { body } = await buildTodo('biz-1', AHORA);
    await assert.rejects(new Response(body).arrayBuffer(), /timeout/);
  });

  it('refuses a business it cannot read', async () => {
    tablasDelNegocio.mockResolvedValue([tabla('sales')]);
    await assert.rejects(buildTodo('biz-1', AHORA), /no se puede leer/);
  });
});

describe('the zip filename', () => {
  it('slugs a name any system can save, and falls back to «negocio»', () => {
    assert.equal(slugDe('Taquería Don Pedro'), 'taqueria-don-pedro');
    assert.equal(slugDe('  ¡Café & Pan, S.A.!  '), 'cafe-pan-s-a');
    assert.equal(slugDe('ñandú'), 'nandu');
    assert.equal(slugDe('🌮🌮'), 'negocio');
    assert.equal(slugDe(''), 'negocio');
    assert.ok(slugDe('x'.repeat(200)).length <= 60);
  });

  it('dates the file by the day in Mexico City', () => {
    assert.equal(fechaMx(new Date('2026-11-05T05:59:00Z')), '2026-11-04');
    assert.equal(fechaMx(new Date('2026-11-05T06:00:00Z')), '2026-11-05');
  });
});
