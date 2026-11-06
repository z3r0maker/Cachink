import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { PlantillaRecurrente, RecurrenteDelMes } from '@xangarro/domain/corp';

import { notaRecurrente } from '../src/server/empresa/registrar-xml-view';
import { filaRecurrente } from '../src/server/empresa/recurrentes-view';

/** E-11, boards CD-01f and CD-06h: a supplier who invoices every month, in the boards' words. */
const contadora: PlantillaRecurrente = {
  id: 'rec-contadora',
  nombre: 'ANA LÓPEZ MARTÍNEZ',
  contraparte: 'ANA LÓPEZ MARTÍNEZ',
  rfc: 'LOMA800101AB2',
  categoria: 'administracion',
  moneda: 'MXN',
  montoEstimado: 3_336_67n,
  diaCargo: 3,
  projectId: null,
  deducible: true,
  activo: true,
  desde: '2026-10',
};

const del = (o: Partial<RecurrenteDelMes>): RecurrenteDelMes => ({
  plantilla: contadora,
  fecha: '2026-11-03',
  estado: 'proximo',
  entryId: null,
  facturaDel: null,
  ...o,
});

describe('filaRecurrente for a supplier who invoices (CD-01f)', () => {
  it('asks for its invoice, and takes you to upload its XML', () => {
    const f = filaRecurrente(del({ estado: 'falta_factura' }), '2026-11');
    assert.deepEqual(
      [f.detalle, f.estado, f.nota, f.accion, f.href],
      [
        'RFC LOMA800101AB2 · factura cada mes',
        'Falta su factura',
        'Pídela a ANA LÓPEZ MARTÍNEZ',
        'Subir su XML',
        '/empresa/facturas',
      ],
    );
  });

  it('says which invoice registered the month, and opens its movement', () => {
    const f = filaRecurrente(
      del({ estado: 'registrado', entryId: 'E7', facturaDel: '2026-11-02' }),
      '2026-11',
    );
    assert.deepEqual(
      [f.estado, f.nota, f.accion, f.href],
      ['Registrado', 'Con su factura del 2 nov', 'Ver', '/empresa/movimientos/E7'],
    );
  });

  it('is still to come with nothing to do, and says when it stopped repeating', () => {
    const f = filaRecurrente(del({}), '2026-11');
    assert.deepEqual([f.estado, f.accion, f.href, f.nota], ['Próximo', null, null, '']);
    const parada = filaRecurrente(del({ plantilla: { ...contadora, activo: false } }), '2026-11');
    assert.equal(parada.detalle, 'RFC LOMA800101AB2 · ya no se repite');
  });

  it('leaves a template without an RFC as it was: «Registrar» once due', () => {
    const vercel = { ...contadora, rfc: null, contraparte: 'Vercel Inc.' };
    const f = filaRecurrente(del({ plantilla: vercel, estado: 'sugerido' }), '2026-11');
    assert.deepEqual([f.detalle, f.accion, f.nota], ['Vercel Inc. · cada mes', 'Registrar', '']);
  });
});

describe('notaRecurrente (CD-06h)', () => {
  it('names the invoice’s day and what happens each month', () => {
    assert.equal(
      notaRecurrente('2026-10-28'),
      'Cada mes esperamos la factura de este RFC cerca del 28. En cuanto registres la del mes, queda lista; si no llega, te recordamos pedirla.',
    );
    assert.match(notaRecurrente('2026-11-03'), /cerca del 3\./);
  });
});
