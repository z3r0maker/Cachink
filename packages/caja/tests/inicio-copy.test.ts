import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { colors } from '@xangarro/tokens';

import { corteChip, sumarHoras } from '../src/inicio/copy';

describe('Inicio: the last cortes and the closing hour', () => {
  it('chips a corte that balanced, one with a surplus and one short', () => {
    const cuadro = corteChip({ etiqueta: 'Ayer', resultado: { tipo: 'cuadro' } });
    assert.deepEqual(cuadro, { label: 'Cuadró', bg: colors.greenSoft, color: colors.greenText });
    const sobro = corteChip({ etiqueta: 'Lun', resultado: { tipo: 'sobro', monto: 1_250n } });
    assert.deepEqual(sobro, {
      label: 'Sobraron $12.50',
      bg: colors.blueSoft,
      color: colors.blueText,
    });
    const falto = corteChip({ etiqueta: 'Dom', resultado: { tipo: 'falto', monto: 50_000n } });
    assert.deepEqual(falto, {
      label: 'Faltaron $500.00',
      bg: colors.redSoft,
      color: colors.redText,
    });
  });

  it('adds hours to «HH:MM» and wraps past midnight', () => {
    assert.equal(sumarHoras('08:15', 12), '20:15');
    assert.equal(sumarHoras('18:05', 8), '02:05');
    assert.equal(sumarHoras('', 3), '03:00');
  });
});
