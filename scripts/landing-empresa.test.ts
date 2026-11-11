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
import { DOMICILIO_COMPLETO, EMPRESA, telHref } from '../apps/landing/landing/empresa.js';

const fuente = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

describe('the landing names the same supplier as checkout', () => {
  it('razón social, RFC, domicilio, correo and teléfono are equal', () => {
    assert.equal(EMPRESA.razonSocial, PROVEEDOR.razonSocial);
    assert.equal(EMPRESA.rfc, PROVEEDOR.rfc);
    assert.equal(DOMICILIO_COMPLETO, PROVEEDOR.domicilio);
    assert.equal(EMPRESA.correo, PROVEEDOR.correo);
    assert.equal(EMPRESA.telefono, PROVEEDOR.telefono);
  });

  it('dials the phone with +52 and no spaces', () => {
    assert.equal(telHref('33 3190 0937'), 'tel:+523331900937');
    assert.equal(telHref(EMPRESA.telefono), 'tel:+523331900937');
  });

  it('both footers mount the contact block', () => {
    assert.match(fuente('apps/landing/home/CtaFooter.jsx'), /<ContactoLegal /);
    assert.match(fuente('apps/landing/src/pages/soporte/Marco.jsx'), /<ContactoLegal /);
  });
});
