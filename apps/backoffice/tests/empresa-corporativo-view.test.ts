import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { ObligacionGuardada } from '@xangarro/application/corp';

import {
  beneficiario,
  filaCertificado,
  lineaSocio,
  porcentaje,
} from '../src/server/empresa/corporativo-view';

/** E-06's corporate book in the board's words. */
describe('shares', () => {
  it('shows each partner’s shares and percentage', () => {
    const t = { 1: 6_000, 2: 6_000, total: 12_000 };
    assert.equal(lineaSocio(1, t), '6,000 acciones · 50 %');
    assert.equal(porcentaje(6_600, 12_000), '55 %');
    assert.equal(porcentaje(1, 3), '33.33 %');
    assert.equal(porcentaje(0, 0), '0 %');
  });
});

describe('beneficiario', () => {
  const aviso = (
    estado: ObligacionGuardada['estado'],
    periodo = '2026-10-02',
  ): ObligacionGuardada => ({
    id: 'o',
    plantillaId: 'beneficiario_controlador',
    periodo,
    titulo: null,
    estado,
    sinPago: false,
  });

  it('is up to date when nothing changed, or when the last notice was filed', () => {
    assert.equal(beneficiario([], '2026-10-08').alDia, true);
    assert.deepEqual(beneficiario([aviso('presentada')], '2026-10-08'), {
      texto: 'Al día · último cambio del 2 oct',
      alDia: true,
    });
  });

  it('shows the deadline of a pending notice, and when it is late', () => {
    assert.equal(
      beneficiario([aviso('pendiente')], '2026-10-08').texto,
      'Aviso pendiente · vence el 23 oct',
    );
    assert.equal(beneficiario([aviso('pendiente')], '2026-10-30').texto, 'Aviso vencido el 23 oct');
  });
});

describe('filaCertificado', () => {
  const csd = {
    id: 'c',
    tipo: 'csd' as const,
    titular: 'mexia' as const,
    serie: '00001000000512344821',
    vence: '2026-11-18',
  };

  it('masks the serial and warns 60 days ahead', () => {
    assert.deepEqual(filaCertificado(csd, '2026-10-08'), {
      id: 'c',
      nombre: 'CSD de MEXIA · serie 0000…4821',
      vence: 'Vence en 41 días',
      tono: 'warn',
    });
  });

  it('shows a far expiry as its month, and a past one as expired', () => {
    assert.equal(filaCertificado({ ...csd, vence: '2030-09-01' }, '2026-10-08').vence, 'Sep 2030');
    assert.equal(filaCertificado({ ...csd, vence: '2026-10-01' }, '2026-10-08').tono, 'bad');
  });
});
