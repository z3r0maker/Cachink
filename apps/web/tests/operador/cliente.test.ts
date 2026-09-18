import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { vistaAbono } from '../../src/operador/cobranza/cliente/abono';
import { cuentaPorId } from '../../src/operador/cobranza/cuentas';
import {
  abiertas,
  estadoCuenta,
  historial,
  libre,
  limiteNota,
  recordatorio,
  ultimoAbono,
  vence,
} from '../../src/operador/cobranza/cliente/derive';
import { HOY } from '../../src/operador/fixtures';

const chuy = cuentaPorId('chuy')!;
const mari = cuentaPorId('mari')!;

describe('detalle de cliente: everything from tickets and abonos', () => {
  it('derives Chuy: $860.00 owed, two open tickets, $640.00 still available', () => {
    const e = estadoCuenta(chuy);
    assert.equal(e.saldo, 860_00n);
    assert.deepEqual(
      abiertas(chuy, e).map((a) => [a.venta.folio, a.pagado, a.pendiente, a.orden]),
      [
        ['V-0288', 400_00n, 400_00n, 'la más antigua'],
        ['V-0310', 0n, 460_00n, 'después de V-0288'],
      ],
    );
    assert.equal(libre(chuy, e), 640_00n);
    assert.equal(ultimoAbono(chuy)?.monto, 400_00n);
  });

  it('derives Mari: V-0340 settled by today’s transfer, $340.00 left', () => {
    const e = estadoCuenta(mari);
    assert.equal(e.saldo, 340_00n);
    assert.equal(abiertas(mari, e)[0]?.venta.folio, 'V-0361');
  });

  it('lists tickets and abonos newest first, each abono with the tickets it reached', () => {
    const h = historial(chuy);
    assert.equal(h[0]?.titulo, 'Abono de $400.00');
    assert.equal(h[0]?.detalle, 'Recibido hoy 13:52 en efectivo · se aplicó a V-0288 en parte');
    assert.equal(h.at(-1)?.titulo, 'Venta fiada V-0288');
  });

  it('names every ticket an abono settles, and what is left as saldo a favor', () => {
    const grande = {
      ...chuy,
      abonos: [{ ...chuy.abonos[0]!, id: 'ab-x', monto: 1_300_00n }],
    };
    assert.equal(
      historial(grande)[0]?.detalle,
      'Recibido hoy 13:52 en efectivo · se aplicó a V-0288 completa y V-0310 completa · $40.00 quedó a su favor',
    );
  });

  it('says each open ticket’s due date against today', () => {
    assert.deepEqual(vence('2026-04-28T13:10', '15 días', HOY), {
      texto: 'Se venció ayer',
      vencido: true,
    });
    assert.deepEqual(vence('2026-05-02T14:20', '15 días', HOY), {
      texto: 'Vence el domingo',
      vencido: false,
    });
    assert.equal(vence('2026-04-20T10:00', '15 días', HOY).texto, 'Se venció hace 9 días');
    assert.equal(vence('2026-05-14T10:00', '30 días', HOY).texto, 'Vence el 13 de junio');
    assert.equal(vence('2026-05-13T10:00', '1 día', HOY).texto, 'Vence hoy');
  });

  it('previews an abono by folio and words the limit and the reminder', () => {
    const e = estadoCuenta(chuy);
    const v = vistaAbono(chuy, e, 500_00n, false);
    assert.deepEqual([v.texto, v.restante], ['V-0288 completa · V-0310 parcial', 360_00n]);
    assert.match(
      limiteNota(chuy, e, 'Pedro'),
      /^Puede fiar hasta \$1,500\.00 con plazo de 15 días/,
    );
    assert.match(
      recordatorio(chuy, e, 'Taquería Don Pedro'),
      /tiene \$860\.00 pendiente en Taquería Don Pedro/,
    );
  });

  it('over the limit, the note says not to sell on credit', () => {
    const corta = { ...mari, limite: 300_00n };
    assert.match(limiteNota(corta, estadoCuenta(corta), 'Pedro'), /^Pasó su límite de \$300\.00/);
  });
});
