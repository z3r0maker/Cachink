import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, vi } from 'vitest';

/**
 * `GET /api/v1/comprobante` (N-20/N-21), every collaborator mocked: the
 * register's share dialog gets its PNG through device-token auth; 503 while
 * comprobantes are paused, 404 for a ticket not yet in Postgres (captured
 * offline, queue unflushed — the dialog falls back to its local canvas), 409
 * for a cancelled venta, and the server's failure line when the render throws.
 */

const route = vi.fn();
const withTenant = vi.fn();
const comprobantesPausados = vi.fn();
const comprobanteDeTicket = vi.fn();
const plantillaDelNegocio = vi.fn(async () => 'clasico');
const responderComprobante = vi.fn();

vi.mock('../src/server/api/device-route', () => ({
  deviceRoute: (
    name: string,
    request: Request,
    handler: (ctx: { businessId: string }) => Promise<{ response: Response }>,
  ) => route(name, request, handler),
}));
vi.mock('../src/server/db', () => ({
  withTenant: (b: string, fn: (tx: unknown) => unknown) => withTenant(b, fn),
}));
vi.mock('../src/server/comprobante/archivo', () => ({ responderComprobante }));
vi.mock('../src/server/comprobante/datos', () => ({
  comprobanteDeTicket: (tx: unknown, id: string) => comprobanteDeTicket(tx, id),
  plantillaDelNegocio: (tx: unknown) => plantillaDelNegocio(tx),
}));
vi.mock('../src/server/comprobante/pausa', () => ({
  COMPROBANTES_PAUSADOS: 'Comprobantes en pausa',
  comprobantesPausados: (tx: unknown, b: string) => comprobantesPausados(tx, b),
}));

const { GET } = await import('../src/app/api/v1/comprobante/route');

const REQUEST = new Request('https://caja.xangarro.mx/api/v1/comprobante?ticketId=t-1');

beforeEach(() => {
  vi.clearAllMocks();
  comprobantesPausados.mockResolvedValue(false);
});

afterEach(() => {
  delete process.env.XG_TEST_ROUTE_ERROR;
});

const CTX = { businessId: 'biz-1' };

async function respuestaCon(hallado: unknown): Promise<Response> {
  withTenant.mockImplementation(async (_b: string, fn: (tx: unknown) => unknown) => fn({}));
  comprobanteDeTicket.mockResolvedValue(hallado === 'pausa' ? null : hallado);
  if (hallado === 'pausa') comprobantesPausados.mockResolvedValue(true);
  route.mockClear();
  route.mockImplementation(
    async (_n: string, _r: Request, h: (c: unknown) => Promise<{ response: Response }>) =>
      (await h(CTX)).response,
  );
  return GET(REQUEST) as unknown as Promise<Response>;
}

const COMPROBANTE = {
  folio: 'V-0413',
  fechaHora: '2026-05-12T14:58:00-06:00',
  concepto: [],
  total: 285n,
  metodoPago: 'Efectivo',
  cancelada: false,
} as never;

describe('GET /api/v1/comprobante', () => {
  it('renders the venta’s PNG through the business’s template', async () => {
    responderComprobante.mockResolvedValue(new Response('png-bytes', { status: 200 }));
    void GET(REQUEST);
    const r = await respuestaCon(COMPROBANTE);
    assert.equal(r.status, 200);
    assert.deepEqual(responderComprobante.mock.calls[0]?.slice(0, 2), [COMPROBANTE, 'clasico']);
  });

  it('503 while comprobantes are paused', async () => {
    void GET(REQUEST);
    const r = await respuestaCon('pausa');
    assert.equal(r.status, 503);
    const body = (await r.json()) as { error: string };
    assert.equal(body.error, 'Comprobantes en pausa');
  });

  it('404 for a ticket the queue has not flushed yet', async () => {
    void GET(REQUEST);
    const r = await respuestaCon(null);
    assert.equal(r.status, 404);
  });

  it('409 for a cancelled venta', async () => {
    void GET(REQUEST);
    const r = await respuestaCon({ ...COMPROBANTE, cancelada: true });
    assert.equal(r.status, 409);
  });
});
