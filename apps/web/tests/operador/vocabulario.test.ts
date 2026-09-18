import { describe, it } from 'vitest';
import assert from 'node:assert/strict';
import { DiscrepancyReasonEnum, ExpenseCategoryEnum } from '@xangarro/domain';

import { MOTIVOS_DIFERENCIA } from '../../src/operador/cierre/types';
import { CATEGORIAS } from '../../src/operador/gastos/types';
import { categoriaDominio, motivoDominio } from '../../src/operador/vocabulario';

describe('operator vocabulary → domain enums (D4, D6)', () => {
  it('maps every expense category onto a stored one', () => {
    for (const c of CATEGORIAS)
      assert.ok(ExpenseCategoryEnum.safeParse(categoriaDominio(c)).success);
    assert.equal(categoriaDominio('Insumos'), 'Materia Prima');
    assert.equal(categoriaDominio('Transporte'), 'Logística');
  });

  it('maps every close-out reason, both ways, onto a stored one', () => {
    for (const m of MOTIVOS_DIFERENCIA) {
      for (const t of ['falta', 'sobra'] as const) {
        assert.ok(DiscrepancyReasonEnum.safeParse(motivoDominio(m, t)).success);
      }
    }
  });

  it('resolves the reasons whose meaning depends on short or over', () => {
    assert.equal(motivoDominio('Cambio mal dado', 'falta'), 'error-en-cambio');
    assert.equal(motivoDominio('Vale de empleado', 'falta'), 'retiro-autorizado');
    assert.equal(motivoDominio('No sé', 'falta'), 'faltante-sin-explicacion');
    assert.equal(motivoDominio('No sé', 'sobra'), 'sobrante');
    assert.equal(motivoDominio('Propinas', 'sobra'), 'sobrante');
    assert.equal(motivoDominio('Venta no registrada', 'falta'), 'otro');
  });
});
