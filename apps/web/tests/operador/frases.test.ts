import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { kpisFor } from '../../src/operador/inicio/kpis';
import { INICIO_FIXTURE } from '../../src/operador/inicio/fixture';
import { TURNO_FIXTURE } from '../../src/operador/turno/fixture';
import {
  diasEntre,
  hintCanceladas,
  hintComprobantes,
  sumarDias,
  textoVence,
} from '../../src/operador/ui/frases';

describe('frases del operador', () => {
  it('words the cancellations for none, one and several', () => {
    assert.equal(hintCanceladas(0, null), 'Ninguna cancelada');
    assert.equal(hintCanceladas(1, '12:58'), 'Una cancelada a las 12:58');
    assert.equal(hintCanceladas(3, '13:40'), 'Tres canceladas, la última a las 13:40');
  });

  it('words the receipts for none, one and several', () => {
    assert.equal(hintComprobantes(0), 'Ninguno lleva comprobante');
    assert.equal(hintComprobantes(1), 'Un comprobante');
    assert.equal(hintComprobantes(4), 'Cuatro con comprobante');
  });

  it('says a due date in words, by weekday within the week, then by date', () => {
    assert.equal(textoVence('2026-05-14', '2026-05-14'), 'Vence hoy');
    assert.equal(textoVence('2026-05-14', '2026-05-15'), 'Vence mañana');
    assert.equal(textoVence('2026-05-14', '2026-05-17'), 'Vence el domingo');
    assert.equal(textoVence('2026-05-14', '2026-05-21'), 'Vence el 21 de mayo');
    assert.equal(diasEntre('2026-05-14', sumarDias('2026-05-14', 40)), 40);
  });

  it('shows the turno figures with the shared sentences', () => {
    assert.equal(hintComprobantes(TURNO_FIXTURE.comprobantes), 'Cuatro con comprobante');
    const inicio = kpisFor(INICIO_FIXTURE);
    assert.deepEqual(
      inicio.map((k) => k.value),
      ['12', '$3,120.00', '$2,710.00', '$182.00'],
    );
  });

  it('says a last turno that did not balance, with its reason', () => {
    const faltante = kpisFor({
      ...INICIO_FIXTURE,
      situacion: 'turno-cerrado',
      ultimoTurno: {
        ...INICIO_FIXTURE.ultimoTurno,
        resultado: { tipo: 'falto', monto: 60_00n, motivo: 'cambio mal dado' },
      },
    })[1];
    assert.equal(faltante?.value, 'Con faltante');
    assert.equal(faltante?.hint, 'Faltaron $60.00, los explicaste como «cambio mal dado»');
  });
});
