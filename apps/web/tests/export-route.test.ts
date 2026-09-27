import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * `GET /api/export/<dataset>` — the gate in front of the stream: a session, a
 * known dataset, and the business's allowance (DB3-EXP-01), in that order, so
 * a refused request never costs an export.
 */
const readSession = vi.fn();
const buildExport = vi.fn();
const throttleTake = vi.fn();

vi.mock('../src/server/session', () => ({ readSession }));
vi.mock('../src/server/export/datasets', () => ({
  buildExport,
  isDataset: (v: string) => v === 'ventas',
}));
vi.mock('../src/server/db', () => ({ db: () => ({ pool: true }) }));
vi.mock('@xangarro/data-pg', () => ({
  throttleKey: (...parts: string[]) => parts.join(':'),
  throttleTake,
}));

const { GET, maxDuration } = await import('../src/app/api/export/[dataset]/route');
const { exportsPerWindow, EXPORT_WINDOW_S } = await import('../src/server/export/limit');

const get = (dataset: string) =>
  GET(new Request(`http://x/api/export/${dataset}`), { params: Promise.resolve({ dataset }) });

beforeEach(() => {
  vi.clearAllMocks();
  readSession.mockResolvedValue({ business_id: 'biz-1' });
  throttleTake.mockResolvedValue(0);
  buildExport.mockResolvedValue({
    filename: 'xangarro-ventas-2026-05-12.xlsx',
    body: new Response('PK').body,
  });
});

describe('the export route', () => {
  it('streams the file with its name when the business has allowance left', async () => {
    const res = await get('ventas');
    assert.equal(res.status, 200);
    assert.match(res.headers.get('Content-Disposition') ?? '', /xangarro-ventas-2026-05-12\.xlsx/);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.equal(await res.text(), 'PK');
    assert.deepEqual(throttleTake.mock.calls[0], [
      { pool: true },
      'export:business:biz-1',
      5,
      EXPORT_WINDOW_S,
    ]);
  });

  it('answers 429 with Retry-After once the allowance is spent, and reads nothing', async () => {
    throttleTake.mockResolvedValue(412);
    const res = await get('ventas');
    assert.equal(res.status, 429);
    assert.equal(res.headers.get('Retry-After'), '412');
    assert.match(((await res.json()) as { error: string }).error, /unos minutos/);
    assert.equal(buildExport.mock.calls.length, 0);
  });

  it('refuses a signed-out caller before counting anything against the business', async () => {
    readSession.mockResolvedValue(null);
    assert.equal((await get('ventas')).status, 401);
    assert.equal(throttleTake.mock.calls.length, 0);
  });

  it('refuses an unknown dataset before counting it', async () => {
    assert.equal((await get('nomina-secreta')).status, 404);
    assert.equal(throttleTake.mock.calls.length, 0);
  });

  it('declares a duration ceiling a long export fits under', () => {
    assert.equal(maxDuration, 300);
  });
});

describe('exportsPerWindow', () => {
  it('reads EXPORTS_PER_TENANT, and falls back to 5 for anything unusable', () => {
    assert.equal(exportsPerWindow('1000'), 1_000);
    for (const bad of [undefined, '', '0', '-1', '1.5', 'muchos']) {
      assert.equal(exportsPerWindow(bad), 5, String(bad));
    }
  });
});
