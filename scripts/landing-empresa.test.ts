/**
 * The landing's `EMPRESA` and the portal's `PROVEEDOR` name the same supplier.
 * The landing is plain JS and keeps its own copy; the footer shows it before
 * anyone signs up and checkout shows `PROVEEDOR` before they pay (LFPC art. 76
 * Bis III), so the two must never drift.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'vitest';

import { PROVEEDOR } from '../packages/domain/src/privacidad/proveedor';
import { DOMICILIO_COMPLETO, EMPRESA } from '../apps/landing/landing/empresa.js';

const fuente = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('the landing names the same supplier as checkout', () => {
  it('razón social, RFC, domicilio and correo are equal', () => {
    assert.equal(EMPRESA.razonSocial, PROVEEDOR.razonSocial);
    assert.equal(EMPRESA.rfc, PROVEEDOR.rfc);
    assert.equal(DOMICILIO_COMPLETO, PROVEEDOR.domicilio);
    assert.equal(EMPRESA.correo, PROVEEDOR.correo);
  });

  it('publishes no phone until the company has its own line', () => {
    assert.equal('telefono' in EMPRESA, false);
    assert.equal('telefono' in PROVEEDOR, false);
    assert.doesNotMatch(fuente('apps/landing/home/ContactoLegal.jsx'), /tel:|llama/i);
    assert.doesNotMatch(fuente('docs/legal/aviso/terminos-borrador.md'), /99 9999 9999/);
  });

  it('both footers mount the contact block', () => {
    assert.match(fuente('apps/landing/home/CtaFooter.jsx'), /<ContactoLegal /);
    assert.match(fuente('apps/landing/src/pages/soporte/Marco.jsx'), /<ContactoLegal /);
  });
});
