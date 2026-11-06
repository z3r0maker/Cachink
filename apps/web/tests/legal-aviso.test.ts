import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  AVISO_VINCULACION_VERSION,
  AvisoVigenteSchema,
  avisoVinculacionTexto,
  avisoVinculacionTextoDe,
} from '@xangarro/domain';

import {
  AVISO_PARRAFOS,
  AVISO_VERSION,
  avisoPublicado,
  avisoTextoCanonico,
  avisoTextoDe,
} from '../src/legal/aviso-simplificado';
import { avisoDeVinculacion, avisoVigente, ipHash } from '../src/server/legal/aviso';

/**
 * Every published version's hash, pinned (ADR-137). The ledger proves which
 * text someone accepted by this hash; if a version's text changed, everyone
 * who accepted it would hold a hash of nothing. Add a line per new version;
 * never edit one.
 */
const HUELLAS: Readonly<Record<string, string>> = {
  '0.2-borrador': '93d2b81f6639e003e45ced8ccc9b26749db76ff1a52b4ad1c289b5f1a48c62ce',
  '0.3-borrador': 'adc31ccd26f95d8709880e40cec7827d18357d26c18987cf139613cf5583457a',
};
const sha = (t: string) => createHash('sha256').update(t, 'utf8').digest('hex');

describe('every published aviso version is kept, unedited (ADR-137)', () => {
  for (const [version, huella] of Object.entries(HUELLAS)) {
    it(`${version} still hashes to what the ledger recorded`, () => {
      assert.equal(sha(avisoTextoDe(version) ?? ''), huella);
    });
  }

  it('the current version is one of them, and the signup hashes exactly its text', () => {
    assert.ok(AVISO_VERSION in HUELLAS, 'pin the new version in HUELLAS');
    assert.equal(avisoTextoCanonico(), avisoTextoDe(AVISO_VERSION));
  });

  it('a version never published has no text', () => {
    assert.equal(avisoTextoDe('9.9-nunca'), undefined);
    assert.equal(avisoPublicado('9.9-nunca'), undefined);
  });

  it('0.3 says what changed and points to «Privacidad y mis datos»', () => {
    const p = avisoPublicado('0.3-borrador');
    assert.match(p?.cambios ?? '', /Privacidad y mis datos/);
    assert.match(p?.parrafos.join(' ') ?? '', /Privacidad y mis datos, en el menú de tu cuenta/);
    assert.doesNotMatch(p?.parrafos.join(' ') ?? '', /Configuración → Privacidad/);
  });
});

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

  it('names the responsable by its razón social and domicilio (2026-10-28)', () => {
    assert.match(
      avisoTextoCanonico(),
      /MEXIA, S\.A\.S\. \(Xangarro\), con domicilio en Paseo Lomas Altas 524/,
    );
    assert.doesNotMatch(avisoTextoCanonico(), /\[RAZÓN SOCIAL\]|\[DOMICILIO\]/);
  });

  it('still carries production placeholders — this test is the reminder to close them', () => {
    // Remove this assertion when docs/launch/production-readiness.md closes the legal-entity items.
    assert.match(avisoTextoCanonico(), /\[CORREO PRIVACIDAD\]/);
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

  it('still hashes 0.2, so a phone on an older build keeps its record', () => {
    const texto = avisoVinculacionTextoDe('0.2-borrador') ?? '';
    const expected = createHash('sha256').update(texto, 'utf8').digest('hex');
    assert.ok(texto.length > 0);
    assert.deepEqual(avisoDeVinculacion('0.2-borrador'), {
      avisoVersion: '0.2-borrador',
      avisoSha256: expected,
    });
    assert.notEqual(expected, avisoDeVinculacion(AVISO_VINCULACION_VERSION).avisoSha256);
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
