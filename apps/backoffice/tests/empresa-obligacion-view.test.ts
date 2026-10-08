import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { vistaDe, type DocumentoMeta } from '@xangarro/application/corp';
import { plantilla } from '@xangarro/domain/corp';

import { accionesDe, tituloDe } from '../src/server/empresa/obligacion-view';

/** E-04's obligation page: what it is called and which steps it allows. */
const isr = plantilla('isr_mensual')!;
const doc = (tipo: DocumentoMeta['tipo']) => ({ tipo }) as DocumentoMeta;

describe('tituloDe', () => {
  it('names the month, the year, or the one-off itself', () => {
    assert.equal(
      tituloDe({ titulo: 'ISR provisional', periodo: '2026-09' }),
      'ISR provisional de septiembre de 2026',
    );
    assert.equal(
      tituloDe({ titulo: 'Declaración anual', periodo: '2026' }),
      'Declaración anual 2026',
    );
    assert.equal(
      tituloDe({ titulo: 'Cesión de la marca', periodo: '2026-11-07' }),
      'Cesión de la marca',
    );
  });
});

describe('accionesDe', () => {
  it('blocks presentada until the acuse is attached, and says so', () => {
    const a = accionesDe(vistaDe(isr, '2026-09', undefined), []);
    assert.deepEqual(
      a.map((x) => [x.label, x.bloqueada]),
      [
        ['Marcar preparada', null],
        ['Marcar presentada', 'Para marcarla presentada, adjunta el acuse.'],
      ],
    );
  });

  it('offers «No hubo pago» while the payment proof is missing', () => {
    const presentada = vistaDe(isr, '2026-09', {
      id: 'o',
      plantillaId: 'isr_mensual',
      periodo: '2026-09',
      titulo: null,
      estado: 'presentada',
      sinPago: false,
    });
    assert.deepEqual(
      accionesDe(presentada, [doc('acuse')]).map((x) => [x.label, x.sinPago]),
      [
        ['Marcar pagada', false],
        ['No hubo pago', true],
      ],
    );
    assert.deepEqual(
      accionesDe(presentada, [doc('acuse'), doc('comprobante_pago')]).map((x) => x.label),
      ['Marcar pagada'],
    );
  });

  it('names a review by its own verb', () => {
    const a = accionesDe(vistaDe(plantilla('buzon')!, '2026-09', undefined), [doc('captura')]);
    assert.deepEqual(
      a.map((x) => [x.label, x.bloqueada]),
      [['Marcar revisada', null]],
    );
  });
});
