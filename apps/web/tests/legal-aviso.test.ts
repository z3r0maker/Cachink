import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  AVISO_VINCULACION_VERSION,
  AvisoVigenteSchema,
  avisoVinculacionTexto,
} from '@xangarro/domain';

import { AVISO_PARRAFOS, AVISO_VERSION, avisoTextoCanonico } from '../src/legal/aviso-simplificado';
import { avisoDeVinculacion, avisoVigente, ipHash } from '../src/server/legal/aviso';

describe('aviso simplificado at signup (N-34, PRIV-REG-01)', () => {
  it('the recorded hash is the SHA-256 of the canonical text, and validates as an AvisoVigente', () => {
    const expected = createHash('sha256').update(avisoTextoCanonico(), 'utf8').digest('hex');
    const v = avisoVigente();
    assert.equal(v.version, AVISO_VERSION);
    assert.equal(v.sha256, expected);
    assert.ok(AvisoVigenteSchema.safeParse(v).success);
  });

  it('is stable across calls — the ledger must never see two hashes for one version', () => {
    assert.deepEqual(avisoVigente(), avisoVigente());
    assert.equal(avisoTextoCanonico(), avisoTextoCanonico());
  });

  it('carries the art. 15 I–IV minimum: responsable, datos, finalidades, cómo limitar', () => {
    const text = AVISO_PARRAFOS.join(' ');
    assert.match(text, /responsable de tus datos/);
    assert.match(text, /patrimoniales o financieros/, 'financial data is named (art. 7 ¶5)');
    assert.match(text, /Para qué:/);
    assert.match(text, /Cómo limitar el uso/);
  });

  it('still carries production placeholders — this test is the reminder to close them', () => {
    // Remove this assertion when docs/launch/production-readiness.md closes the legal-entity items.
    assert.match(avisoTextoCanonico(), /\[RAZÓN SOCIAL\]/);
  });

  it('hashes an IP and leaves an unknown one empty', () => {
    assert.equal(ipHash(''), '');
    assert.match(ipHash('203.0.113.9'), /^[0-9a-f]{64}$/);
    assert.notEqual(ipHash('203.0.113.9'), ipHash('203.0.113.10'));
  });
});

describe('aviso shown at device linking (N-34, variante B)', () => {
  it('keeps the version and the hash of the text this server knows for it', () => {
    const expected = createHash('sha256').update(avisoVinculacionTexto(), 'utf8').digest('hex');
    assert.deepEqual(avisoDeVinculacion(AVISO_VINCULACION_VERSION), {
      avisoVersion: AVISO_VINCULACION_VERSION,
      avisoSha256: expected,
    });
  });

  it('keeps an unknown version without inventing a hash, and nothing for an older app', () => {
    assert.deepEqual(avisoDeVinculacion('9.9'), { avisoVersion: '9.9', avisoSha256: null });
    assert.deepEqual(avisoDeVinculacion(undefined), { avisoVersion: null, avisoSha256: null });
  });

  it('names the public aviso, never the portal (ADR-069)', () => {
    assert.match(avisoVinculacionTexto(), /xangarro\.mx\/privacidad/);
    assert.doesNotMatch(avisoVinculacionTexto(), /app\.xangarro/);
  });
});
