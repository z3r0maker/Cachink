import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { PeriodoCerradoError, TipoCambioInvalidoError } from '@xangarro/domain/corp';

import { correoReapertura } from '../src/server/empresa/cierre-correo';
import { mesCerrado } from '../src/server/empresa/cierre-falla';
import { cuandoFue, historialDe } from '../src/server/empresa/cierre-historial';
import { CERRADO_OCT, PEDIDO_OCT, cerrado, datos, enCurso } from './cierre-fixture';

/** «Meses de 2026», Registrar in a closed month and the request's email (E-14, CD-10b). */
describe('the year’s months', () => {
  it('lists each month with movements, newest first, with its history', () => {
    const h = historialDe(datos(enCurso));
    assert.deepEqual(
      h.map((m) => [m.nombre, m.estado, m.detalle]),
      [
        ['Octubre', 'Abierto', 'Sin cerrar'],
        ['Septiembre', 'Cerrado', 'Cerrado el 18 oct por Ana'],
        ['Agosto', 'Cerrado', 'Cerrado'],
      ],
    );
  });

  it('tells a request, its approval and the second close in one line', () => {
    const d = cerrado(true);
    const pedido = historialDe(d).find((m) => m.mes === '2026-10');
    assert.equal(pedido?.estado, 'Reabrir pedido');
    assert.match(pedido?.detalle ?? '', /Eduardo pidió reabrirlo el 21 nov: «Falta la comisión/);
    const reabierto = historialDe({
      ...d,
      cerrados: new Set(['2026-08', '2026-09', '2026-10']),
      eventos: new Map([
        [
          '2026-10',
          [
            CERRADO_OCT,
            PEDIDO_OCT,
            { kind: 'reabierto', founderId: 'f2', motivo: null, at: '2026-11-21T17:00:00.000Z' },
            { kind: 'cerrado', founderId: 'f2', motivo: null, at: '2026-11-21T18:00:00.000Z' },
          ],
        ],
      ]),
    }).find((m) => m.mes === '2026-10');
    assert.equal(
      reabierto?.detalle,
      'Cerrado el 20 nov por Eduardo · reabierto el 21 nov (pidió Eduardo, aprobó Ana: «Falta la comisión del banco del 31 de octubre, $17.40.») · cerrado otra vez el 21 nov por Ana',
    );
    assert.equal(reabierto?.estado, 'Cerrado');
  });

  it('dates an event in Mexico', () => {
    assert.equal(cuandoFue('2026-11-21T00:05:00.000Z'), '20 nov a las 18:05');
  });
});

describe('Registrar in a closed month (board CD-10b)', () => {
  it('names the month, the open one to use, and the way to its close', () => {
    const f = mesCerrado(new PeriodoCerradoError('2026-10-31'), '2026-11-21');
    assert.equal(
      f?.message,
      'Octubre está cerrado. Registra con una fecha de noviembre, o pide reabrir octubre para registrarlo ahí. Reabrir lo tiene que aprobar el otro socio.',
    );
    assert.deepEqual(f?.enlace, {
      texto: 'Ir al cierre de octubre',
      href: '/empresa/cierre?mes=2026-10',
    });
  });

  it('leaves an invalid date and any other error to the usual answer', () => {
    assert.equal(mesCerrado(new PeriodoCerradoError('2026-02-30'), '2026-11-21'), null);
    assert.equal(mesCerrado(new TipoCambioInvalidoError('x'), '2026-11-21'), null);
    assert.equal(mesCerrado(new Error('x'), '2026-11-21'), null);
  });
});

describe('the request’s email', () => {
  it('reaches the other founder with the reason and the way to answer', () => {
    const c = correoReapertura('2026-10', 'Eduardo', 'Falta la comisión', 'https://admin.example');
    assert.equal(c.subject, 'MEXIA: Eduardo pidió reabrir octubre');
    assert.match(c.paragraphs[0] ?? '', /«Falta la comisión»/);
    assert.deepEqual(c.cta, {
      label: 'Revisar el pedido',
      href: 'https://admin.example/empresa/cierre?mes=2026-10&panel=aprobar',
    });
  });
});
