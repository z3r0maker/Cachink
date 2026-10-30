import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { FacturaRecibida, Rechazo } from '@xangarro/application/corp';
import { leerCfdi } from '@xangarro/domain/corp';
import { cfdiXml } from '@xangarro/testing/corp';

import {
  fueraDe,
  leerRechazos,
  resumenRevision,
  serializarRechazos,
  tarjetaDe,
} from '../src/server/empresa/revision-view';

/** E-11, board CD-06c: «Revisa antes de registrar». */
const pendiente: FacturaRecibida = {
  cfdi: leerCfdi(cfdiXml({ fecha: '2026-10-28' })),
  archivo: 'contador.xml',
  estado: 'por_revisar',
  estadoSat: 'vigente',
  categoria: null,
  projectId: null,
  entryId: null,
  pagoEntryId: null,
};
const rechazo = (r: Partial<Rechazo>): Rechazo => ({
  archivo: 'a.xml',
  motivo: 'otro_rfc',
  proveedor: 'Papelería, S.A.',
  fecha: '2026-10-15',
  entryId: null,
  ...r,
});

describe('tarjetaDe (E-11)', () => {
  it('shows the board’s card: the supplier, the XML’s amounts and what was paid', () => {
    const t = tarjetaDe(pendiente, null);
    assert.equal(
      t.sub,
      '28 oct 2026 · RFC LOMA800101AB2 · persona física · pagada (PUE) · contador.xml',
    );
    assert.deepEqual(
      t.montos.map((m) => `${m.label} ${m.value}`),
      [
        'Subtotal $3,500.00',
        'IVA $560.00',
        'ISR retenido $350.00',
        'IVA retenido $373.33',
        'Se pagó $3,336.67',
      ],
    );
    assert.deepEqual([t.categoria, t.proyecto, t.verificada], [null, '', true]);
    assert.equal(t.nota, 'Elige una; la recordamos para este RFC.');
  });

  it('preselects the supplier’s last category and project', () => {
    const t = tarjetaDe(pendiente, { categoria: 'administracion', projectId: 'xangarro' });
    assert.deepEqual(
      [t.categoria, t.proyecto, t.nota],
      ['administracion', 'xangarro', 'Como sus facturas anteriores.'],
    );
  });

  it('says «Por pagar» for an invoice on credit, and marks an unverified one', () => {
    const t = tarjetaDe(
      { ...pendiente, estadoSat: 'sin_verificar', cfdi: { ...pendiente.cfdi, metodoPago: 'PPD' } },
      null,
    );
    assert.equal(t.montos.at(-1)?.label, 'Por pagar');
    assert.equal(t.verificada, false);
  });
});

describe('fueraDe (E-11)', () => {
  it('words the board’s three refusals', () => {
    const ya = fueraDe(
      rechazo({
        motivo: 'ya_registrada',
        entryId: 'e1',
        proveedor: 'Agencia',
        fecha: '2026-10-12',
      }),
    );
    assert.deepEqual(
      [ya.etiqueta, ya.titulo, ya.entryId],
      ['Ya registrada', 'Agencia · 12 oct', 'e1'],
    );
    assert.match(ya.texto, /movimiento de octubre\.$/);
    assert.equal(fueraDe(rechazo({ motivo: 'cancelada' })).tono, 'alerta');
    assert.equal(
      fueraDe(rechazo({})).texto,
      'Está a nombre de otro RFC, no de MEXIA. Pídele al proveedor que la emita a MEXIA, S.A.S.',
    );
  });

  it('names an unreadable file by its file name, with the reader’s reason', () => {
    const f = fueraDe(
      rechazo({ motivo: 'complemento_pago', proveedor: null, fecha: null, archivo: 'rep.xml' }),
    );
    assert.deepEqual([f.etiqueta, f.titulo], ['No es una factura', 'rep.xml']);
    assert.match(f.texto, /complemento de pago/);
  });
});

describe('the review’s subtitle and its cookie (E-11)', () => {
  it('counts the upload as the board does, or what still waits', () => {
    assert.equal(
      resumenRevision(2, 3, true),
      'Subiste 5 archivos. 2 están listos; 3 no se registran y aquí te decimos por qué.',
    );
    assert.equal(resumenRevision(1, 0, true), 'Subiste 1 archivo. Está listo para registrar.');
    assert.equal(resumenRevision(2, 0, false), 'Tienes 2 facturas por registrar.');
  });

  it('carries refusals through the cookie and drops whatever it cannot trust', () => {
    const r = [rechazo({}), rechazo({ motivo: 'ya_registrada', entryId: 'e1' })];
    assert.deepEqual(leerRechazos(serializarRechazos(r)), r);
    assert.deepEqual(leerRechazos(undefined), []);
    assert.deepEqual(leerRechazos('{no es json'), []);
    assert.deepEqual(
      leerRechazos(JSON.stringify([{ a: 'x.xml', m: 'inventado' }, { m: 'otro_rfc' }])),
      [],
    );
  });
});
