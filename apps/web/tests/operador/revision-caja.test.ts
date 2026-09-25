import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { colors } from '@xangarro/tokens';

import { REVISION_FIXTURE } from './revision-fixture';
import {
  aprobadoProducto,
  avisoRechazo,
  fiadoSinLimite,
  margen,
  semaforo,
} from '../../src/app/(portal)/revision-caja/derive';

describe('revisión de caja', () => {
  it('sums the new credit clients and names how many', () => {
    assert.deepEqual(fiadoSinLimite(REVISION_FIXTURE.clientes), {
      monto: 420_00n,
      hint: 'Dos clientes nuevos sin límite ni plazo',
    });
    assert.equal(
      fiadoSinLimite(REVISION_FIXTURE.clientes.slice(0, 1)).hint,
      'Un cliente nuevo sin límite ni plazo',
    );
  });

  it('computes the live margin with the domain and lights it', () => {
    assert.equal(margen(95_00n, 38_00n), 60);
    assert.equal(margen(75_00n, 60_00n), 20);
    assert.equal(margen(95_00n, null), null);
    assert.equal(margen(95_00n, 0n), null);
    assert.equal(semaforo(60), colors.greenSoft);
    assert.equal(semaforo(20), colors.yellowSoft);
    assert.equal(semaforo(10), colors.redSoft);
    assert.equal(semaforo(null), colors.gray100);
  });

  it('words the exits as the file does', () => {
    assert.equal(
      aprobadoProducto('Orden de tripa', 38_00n, 60),
      'Orden de tripa entra al catálogo con costo $38.00 y margen 60%. Ya calcula utilidad en tus estados.',
    );
    assert.equal(avisoRechazo(false, 'Doña Chelo').title, 'Cliente rechazado');
  });
});
