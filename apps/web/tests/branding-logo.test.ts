import assert from 'node:assert/strict';
import sharp from 'sharp';
import { describe, it } from 'vitest';

import { MAX_LOGO_BYTES, processLogo } from '../src/server/branding/logo';

/**
 * One uploaded logo (N-19): the gates, the SVG sanitiser's last word, and the
 * brand colour — with real images, since decoding is what this module adds
 * to the domain's rules. Every refusal is the owner's to fix, so it carries
 * `LOGO_INVALIDO` and a message written for them.
 */

async function refusal(file: File): Promise<string> {
  const err = await processLogo(file).catch((e: unknown) => e);
  assert.ok(err instanceof Error, `expected a refusal, got ${String(err)}`);
  assert.equal((err as { code?: string }).code, 'LOGO_INVALIDO');
  return err.message;
}

async function redSquare(): Promise<Buffer> {
  return sharp({ create: { width: 32, height: 32, channels: 3, background: '#d62828' } })
    .png()
    .toBuffer();
}

describe('processLogo — accepted', () => {
  it('a PNG keeps its bytes and gives the colour it is made of', async () => {
    const png = await redSquare();
    const r = await processLogo(new File([png], 'logo.png', { type: 'image/png' }));
    assert.equal(r.mime, 'image/png');
    assert.equal(Buffer.compare(r.bytes, png), 0);
    assert.match(r.brandColor ?? '', /^#[0-9a-f]{6}$/i);
    assert.equal(parseInt((r.brandColor ?? '#000000').slice(1, 3), 16) > 180, true);
  });

  it('`image/jpg` is read as the JPEG it is', async () => {
    const jpg = await sharp(await redSquare())
      .jpeg()
      .toBuffer();
    const r = await processLogo(new File([jpg], 'logo.jpg', { type: 'image/jpg' }));
    assert.equal(r.mime, 'image/jpeg');
  });

  it('an SVG is stored sanitised, its fill as the brand colour', async () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg"><!-- note --><rect fill="#1d7a46" width="9" height="9"/></svg>';
    const r = await processLogo(new File([svg], 'logo.svg', { type: 'image/svg+xml' }));
    assert.equal(r.mime, 'image/svg+xml');
    assert.doesNotMatch(r.bytes.toString('utf8'), /note/);
    assert.equal(r.brandColor?.toLowerCase(), '#1d7a46');
  });
});

describe('processLogo — refused, each in the owner’s words', () => {
  it('an empty file', async () => {
    assert.equal(
      await refusal(new File([], 'logo.png', { type: 'image/png' })),
      'Elige un archivo.',
    );
  });

  it('a file over 2 MB', async () => {
    const big = new File([new Uint8Array(MAX_LOGO_BYTES + 1)], 'logo.png', { type: 'image/png' });
    assert.equal(await refusal(big), 'El logo pesa más de 2 MB.');
  });

  it('a format it does not take', async () => {
    const gif = new File([new Uint8Array([71, 73, 70])], 'logo.gif', { type: 'image/gif' });
    assert.equal(await refusal(gif), 'El logo debe ser PNG, JPG o SVG.');
  });

  it('an SVG that still carries script after sanitising', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script';
    assert.equal(
      await refusal(new File([svg], 'logo.svg', { type: 'image/svg+xml' })),
      'Ese SVG trae elementos que no permitimos.',
    );
  });

  it('bytes that claim to be a PNG and are not: the owner’s file, not an outage', async () => {
    const fake = new File([new Uint8Array([1, 2, 3, 4, 5])], 'logo.png', { type: 'image/png' });
    assert.equal(await refusal(fake), 'No pudimos leer esa imagen. Prueba con otro archivo.');
  });
});
