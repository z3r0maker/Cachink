import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * `GET /api/export/todo` — the gate in front of «Descargar todo»: a session,
 * the owner's role, then the business's export allowance, in that order, so a
 * refused request never spends an export (DB3-EXP-01).
 */
const readSession = vi.fn();
const buildTodo = vi.fn();
const throttleTake = vi.fn();

const negociosOf = vi.fn();
vi.mock('../src/server/session', () => ({ readSession }));
vi.mock('../src/server/memberships', () => ({ negociosOf }));
vi.mock('../src/server/export/todo', () => ({ buildTodo }));
vi.mock('../src/server/db', () => ({ db: () => ({ pool: true }) }));
vi.mock('next/navigation', () => ({ redirect: vi.fn() }));
vi.mock('@xangarro/data-pg', () => ({
  throttleKey: (...parts: string[]) => parts.join(':'),
  throttleTake,
}));

const { GET, maxDuration } = await import('../src/app/api/export/todo/route');
const { EXPORT_WINDOW_S } = await import('../src/server/export/limit');

const sesion = (member_role: 'owner' | 'admin' | 'viewer') => ({
  sub: 'user-1',
  business_id: 'biz-1',
  member_role,
});
const req = (query = '') => new Request(`https://app.xangarro.mx/api/export/todo${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  readSession.mockResolvedValue(sesion('owner'));
  throttleTake.mockResolvedValue(0);
  buildTodo.mockResolvedValue({
    filename: 'xangarro-taqueria-don-pedro-2026-11-05.zip',
    body: new Response('PK').body,
  });
});

describe('the «Descargar todo» route', () => {
  it('streams the zip to the owner, counted as one export of their business', async () => {
    const res = await GET(req());
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('Content-Type'), 'application/zip');
    assert.match(
      res.headers.get('Content-Disposition') ?? '',
      /attachment; filename="xangarro-taqueria-don-pedro-2026-11-05\.zip"/,
    );
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
    assert.equal(await res.text(), 'PK');
    assert.deepEqual(buildTodo.mock.calls, [['biz-1']]);
    assert.deepEqual(throttleTake.mock.calls, [
      [{ pool: true }, 'export:business:biz-1', 5, EXPORT_WINDOW_S],
    ]);
  });

  it('refuses a signed-out caller before counting anything', async () => {
    readSession.mockResolvedValue(null);
    assert.equal((await GET(req())).status, 401);
    assert.equal(throttleTake.mock.calls.length, 0);
    assert.equal(buildTodo.mock.calls.length, 0);
  });

  for (const role of ['admin', 'viewer'] as const) {
    it(`refuses an ${role}: everything is the owner's to take`, async () => {
      readSession.mockResolvedValue(sesion(role));
      const res = await GET(req());
      assert.equal(res.status, 403);
      assert.match(((await res.json()) as { error: string }).error, /dueño/);
      assert.equal(throttleTake.mock.calls.length, 0);
      assert.equal(buildTodo.mock.calls.length, 0);
    });
  }

  it('answers 429 with Retry-After once the allowance is spent, and reads nothing', async () => {
    throttleTake.mockResolvedValue(300);
    const res = await GET(req());
    assert.equal(res.status, 429);
    assert.equal(res.headers.get('Retry-After'), '300');
    assert.match(((await res.json()) as { error: string }).error, /unos minutos/);
    assert.equal(buildTodo.mock.calls.length, 0);
  });

  it('declares a duration ceiling a whole history fits under', () => {
    assert.equal(maxDuration, 300);
  });

  it('exports another business the same account owns, by ?negocio= (ADR-136)', async () => {
    negociosOf.mockResolvedValue([
      { businessId: 'biz-1', role: 'owner', nombre: 'A' },
      { businessId: 'biz-2', role: 'owner', nombre: 'B' },
    ]);
    assert.equal((await GET(req('?negocio=biz-2'))).status, 200);
    assert.deepEqual(buildTodo.mock.calls, [['biz-2']]);
  });

  it('refuses ?negocio= for a business the account only belongs to, or not at all', async () => {
    negociosOf.mockResolvedValue([{ businessId: 'biz-3', role: 'viewer', nombre: 'C' }]);
    assert.equal((await GET(req('?negocio=biz-3'))).status, 403);
    assert.equal((await GET(req('?negocio=biz-9'))).status, 403);
    assert.equal(buildTodo.mock.calls.length, 0);
    assert.equal(throttleTake.mock.calls.length, 0);
  });
});
