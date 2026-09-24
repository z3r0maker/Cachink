import assert from 'node:assert/strict';
import { beforeEach, describe, it, vi } from 'vitest';
import { colors } from '@xangarro/tokens';

/**
 * Negocio → Comprobantes (N-19): the logo upload and the receipt fields. The
 * E2E spec saves one happy form; the validation, the colour rule and what the
 * owner is told when something fails are here.
 */

const requireMember = vi.fn();
const reportError = vi.fn();
const revalidatePath = vi.fn();
const processLogo = vi.fn();
const upsertLogo = vi.fn();
const findById = vi.fn();
const update = vi.fn();

vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('../../src/server/auth', () => ({ requireMember }));
vi.mock('../../src/server/db', () => ({
  withTenant: (_biz: string, fn: (tx: unknown) => unknown) => fn({ tx: true }),
}));
vi.mock('../../src/server/observability/report', () => ({ reportError }));
vi.mock('../../src/server/branding/logo', () => ({ LOGO_INVALIDO: 'LOGO_INVALIDO', processLogo }));
vi.mock('../../src/server/billing/origin', () => ({
  portalOrigin: () => Promise.resolve('https://app.xangarro.mx'),
}));
vi.mock('../../src/server/repositories/businesses', () => ({
  pgBusinessesRepository: () => ({ findById, update }),
}));
vi.mock('@xangarro/data-pg', () => ({ upsertLogo, logoPublico: vi.fn() }));

const { subirLogo, guardarComprobantes } = await import('../../src/server/actions/comprobantes');

const coded = (code: string, message: string) => Object.assign(new Error(message), { code });

function logoForm(file: unknown = new File([new Uint8Array([1])], 'logo.png')): FormData {
  const form = new FormData();
  if (file !== undefined) form.set('logo', file as Blob);
  return form;
}

const FORM = {
  receiptTemplate: 'moderno',
  receiptLeyenda: '  ¡Gracias!  ',
  addressPrint: true,
  direccion: ' Av. Juárez 12 ',
  whatsapp: ' 55 1234 5678 ',
  brandColor: '#D62828',
} as const;

beforeEach(() => {
  vi.clearAllMocks();
  requireMember.mockResolvedValue({ business_id: 'biz-1' });
  findById.mockResolvedValue({ brandColor: null });
  processLogo.mockResolvedValue({
    mime: 'image/png',
    bytes: Buffer.from([1]),
    brandColor: '#d62828',
  });
});

describe('subirLogo', () => {
  it('stores the logo, points the phones at its absolute URL, and takes its colour', async () => {
    assert.deepEqual(await subirLogo(logoForm()), { ok: true, brandColor: '#d62828' });
    assert.deepEqual(upsertLogo.mock.calls[0]?.[1], {
      businessId: 'biz-1',
      mime: 'image/png',
      bytes: Buffer.from([1]),
    });
    assert.deepEqual(update.mock.calls[0], [
      'biz-1',
      { logoUrl: 'https://app.xangarro.mx/api/logos/biz-1', brandColor: '#d62828' },
    ]);
    assert.deepEqual(revalidatePath.mock.calls, [['/negocio'], ['/negocio/comprobantes']]);
  });

  it('never overwrites a colour the owner chose', async () => {
    findById.mockResolvedValue({ brandColor: '#000000' });
    await subirLogo(logoForm());
    assert.deepEqual(update.mock.calls[0]?.[1], {
      logoUrl: 'https://app.xangarro.mx/api/logos/biz-1',
    });
  });

  it('no file chosen says so', async () => {
    assert.deepEqual(await subirLogo(logoForm('texto')), {
      ok: false,
      message: 'Elige un archivo.',
    });
    assert.equal(processLogo.mock.calls.length, 0);
  });

  it('a logo the owner must fix is named back and is not an incident', async () => {
    processLogo.mockRejectedValue(coded('LOGO_INVALIDO', 'El logo pesa más de 2 MB.'));
    assert.deepEqual(await subirLogo(logoForm()), {
      ok: false,
      message: 'El logo pesa más de 2 MB.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });

  it('a database failure is reported, and never shown in its own words', async () => {
    const pg = new Error('relation "business_logos" does not exist');
    upsertLogo.mockRejectedValue(pg);
    assert.deepEqual(await subirLogo(logoForm()), {
      ok: false,
      message: 'No pudimos guardar el logo. Intenta de nuevo.',
    });
    assert.deepEqual(reportError.mock.calls[0], [pg, { endpoint: 'subirLogo' }]);
  });

  it('a member without the role is told why', async () => {
    requireMember.mockRejectedValue(coded('NOT_PERMITTED', 'Solo el dueño o un admin.'));
    assert.deepEqual(await subirLogo(logoForm()), {
      ok: false,
      message: 'Solo el dueño o un admin.',
    });
    assert.equal(reportError.mock.calls.length, 0);
  });
});

describe('guardarComprobantes', () => {
  it('trims what was typed, stores blanks as null and the colour lowercased', async () => {
    assert.deepEqual(await guardarComprobantes(FORM), { ok: true });
    assert.deepEqual(update.mock.calls[0], [
      'biz-1',
      {
        receiptTemplate: 'moderno',
        receiptLeyenda: '¡Gracias!',
        addressPrint: true,
        direccion: 'Av. Juárez 12',
        whatsapp: '55 1234 5678',
        brandColor: '#d62828',
      },
    ]);
    await guardarComprobantes({ ...FORM, receiptLeyenda: ' ', direccion: '', whatsapp: '' });
    const blanks = update.mock.calls[1]?.[1] as Record<string, unknown>;
    assert.deepEqual(
      [blanks.receiptLeyenda, blanks.direccion, blanks.whatsapp],
      [null, null, null],
    );
  });

  it('each limit refuses with its reason, before anything is written', async () => {
    const cases: [Partial<typeof FORM>, string][] = [
      [{ receiptLeyenda: 'x'.repeat(281) }, 'La leyenda no pasa de 280 caracteres.'],
      [{ direccion: 'x'.repeat(141) }, 'La dirección no pasa de 140 caracteres.'],
      [{ whatsapp: 'llámame' }, 'El WhatsApp no parece un teléfono.'],
      [{ brandColor: 'rojo' }, `El color debe ser un hexadecimal como ${colors.yellow}.`],
    ];
    for (const [patch, message] of cases) {
      assert.deepEqual(await guardarComprobantes({ ...FORM, ...patch }), { ok: false, message });
    }
    assert.equal(update.mock.calls.length, 0);
  });

  it('an outage is reported and gets the retry message; a viewer is told why', async () => {
    update.mockRejectedValueOnce(new Error('timeout'));
    assert.deepEqual(await guardarComprobantes(FORM), {
      ok: false,
      message: 'No pudimos guardar. Intenta de nuevo.',
    });
    assert.equal(reportError.mock.calls.length, 1);
    requireMember.mockRejectedValue(coded('NOT_PERMITTED', 'No tienes permiso.'));
    assert.deepEqual(await guardarComprobantes(FORM), { ok: false, message: 'No tienes permiso.' });
  });
});
