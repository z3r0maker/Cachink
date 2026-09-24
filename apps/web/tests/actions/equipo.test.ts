import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';

/**
 * «Generar otro» and «Enviar por correo» (P-06). The E2E specs mint and send
 * a code; what they cannot provoke is here — a code collision, a database that
 * fails, a member without the role — and above all what the owner is told
 * then: never a database's own words.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const mintActivationCode = vi.fn();
const liveActivationCode = vi.fn();
const getBusiness = vi.fn();
const sendActivationCode = vi.fn();
const withTenant = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({ withTenant }));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/activation', () => ({ CODE_TTL_MS: 48 * 3_600_000, mintActivationCode }));
vi.mock('../../src/server/email/activation-code', () => ({ sendActivationCode }));
vi.mock('@xangarro/data-pg', () => ({ activationCodes: {}, getBusiness, liveActivationCode }));

const { generarCodigo, enviarCodigoPorCorreo } = await import('../../src/server/actions/equipo');

const coded = (code: string, message: string) => Object.assign(new Error(message), { code });

/** A transaction whose inserts collide `collisions` times before one lands. */
function txColliding(collisions: number) {
  let inserts = 0;
  const expired = vi.fn();
  const tx = {
    update: () => ({ set: () => ({ where: expired }) }),
    insert: () => ({
      values: (row: { code: string }) => ({
        onConflictDoNothing: () => ({
          returning: async () => (inserts++ < collisions ? [] : [{ code: row.code }]),
        }),
      }),
    }),
  };
  return { tx, expired };
}

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1', email: 'pedro@taqueria.mx' });
  // clearAllMocks keeps queued once-values; a test that used fewer would shift the next.
  mintActivationCode
    .mockReset()
    .mockReturnValueOnce('AAAA1111')
    .mockReturnValueOnce('BBBB2222')
    .mockReturnValueOnce('CCCC3333');
});

describe('generarCodigo', () => {
  it('expires the live codes, then mints one that lives 48 hours', async () => {
    const { tx, expired } = txColliding(0);
    withTenant.mockImplementation((_b: string, fn: (t: unknown) => unknown) => fn(tx));
    const r = await generarCodigo();
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.code, 'AAAA1111');
    const hours = (Date.parse(r.expiresAt) - Date.now()) / 3_600_000;
    assert.ok(hours > 47.9 && hours <= 48, `expires in ${hours} h`);
    assert.equal(expired.mock.calls.length, 1);
    assert.deepEqual(revalidatePath.mock.calls, [['/equipo']]);
  });

  it('a collision is retried, not shown', async () => {
    const { tx } = txColliding(2);
    withTenant.mockImplementation((_b: string, fn: (t: unknown) => unknown) => fn(tx));
    const r = await generarCodigo();
    assert.deepEqual(r.ok && r.code, 'CCCC3333');
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('three collisions in a row: the retry message, and it is reported', async () => {
    const { tx } = txColliding(3);
    withTenant.mockImplementation((_b: string, fn: (t: unknown) => unknown) => fn(tx));
    assert.deepEqual(await generarCodigo(), {
      ok: false,
      message: 'No pudimos generar el código. Intenta de nuevo.',
    });
    assert.equal(reportError.mock.calls.length, 1);
  });

  it('a database failure is never shown in the database’s words', async () => {
    const pg = new Error('terminating connection due to administrator command');
    withTenant.mockRejectedValue(pg);
    assert.deepEqual(await generarCodigo(), {
      ok: false,
      message: 'No pudimos generar el código. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls[0], [pg, { endpoint: 'generarCodigo' }]);
  });

  it('a member without the role is told so, and it is not an incident', async () => {
    requireMember.mockRejectedValue(coded('NOT_PERMITTED', 'Solo el dueño o un admin.'));
    assert.deepEqual(await generarCodigo(), { ok: false, message: 'Solo el dueño o un admin.' });
    assert.equal(reportError.mock.calls.length, 0);
  });
});

describe('enviarCodigoPorCorreo', () => {
  beforeEach(() => {
    withTenant.mockImplementation((_b: string, fn: (t: unknown) => unknown) => fn({}));
    getBusiness.mockResolvedValue({ nombre: 'Taquería Don Pedro' });
    liveActivationCode.mockResolvedValue({ code: 'AAAA1111', expiresAt: '2026-09-26T00:00:00Z' });
    sendActivationCode.mockResolvedValue({ ok: true });
  });

  it('sends the live code, to the address as typed but trimmed and lowercased', async () => {
    assert.deepEqual(await enviarCodigoPorCorreo('  Lupita@Taqueria.MX '), {
      ok: true,
      sentTo: 'lupita@taqueria.mx',
    });
    assert.deepEqual(sendActivationCode.mock.calls[0], [
      'lupita@taqueria.mx',
      { code: 'AAAA1111', negocio: 'Taquería Don Pedro', expiresAt: '2026-09-26T00:00:00Z' },
    ]);
  });

  it('refuses an address that is not one, before reading anything', async () => {
    assert.deepEqual(await enviarCodigoPorCorreo('lupita@'), {
      ok: false,
      message: 'Escribe un correo válido.',
    });
    assert.equal(withTenant.mock.calls.length, 0);
  });

  it('with no live code there is nothing to send', async () => {
    liveActivationCode.mockResolvedValue(null);
    assert.deepEqual(await enviarCodigoPorCorreo('lupita@taqueria.mx'), {
      ok: false,
      message: 'Genera un código primero.',
    });
  });

  it('a failed send says so; a business without a name is «tu negocio»', async () => {
    getBusiness.mockResolvedValue(null);
    sendActivationCode.mockResolvedValue({ ok: false });
    assert.deepEqual(await enviarCodigoPorCorreo('lupita@taqueria.mx'), {
      ok: false,
      message: 'No pudimos enviar el correo. Intenta de nuevo.',
    });
    assert.equal(
      (sendActivationCode.mock.calls[0]?.[1] as { negocio: string }).negocio,
      'tu negocio',
    );
  });

  it('a member without the role is told so, and it is not an incident', async () => {
    requireMember.mockRejectedValue(coded('NOT_PERMITTED', 'Solo el dueño o un admin.'));
    assert.deepEqual(await enviarCodigoPorCorreo('lupita@taqueria.mx'), {
      ok: false,
      message: 'Solo el dueño o un admin.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });
});
