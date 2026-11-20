import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { eventoDeMovimiento, TableroError, type Movimiento } from '../../src/corp/tablero/index.js';
import { ev, tarjeta } from './tablero-fixture.js';

const codigo = (code: string) => (e: unknown) => e instanceof TableroError && e.code === code;

const mov = (over: Partial<Movimiento>): Movimiento => ({
  accion: 'iniciar',
  socio: 1,
  hoy: '2026-11-12',
  enlace: null,
  documentoId: null,
  motivo: null,
  aceptada: null,
  ...over,
});

const enRevision = tarjeta({ eventos: [ev('terminada', '2026-11-12', 1)] });
const objetada = tarjeta({
  eventos: [ev('terminada', '2026-11-12', 1), ev('objetada', '2026-11-14', 2)],
});

describe('eventoDeMovimiento (OD-4 §3)', () => {
  it('the owner starts a valued card and marks it finished with evidence', () => {
    const inicio = eventoDeMovimiento(tarjeta(), mov({ accion: 'iniciar' }));
    assert.equal(inicio.tipo, 'iniciada');
    const fin = eventoDeMovimiento(
      tarjeta({ eventos: [inicio] }),
      mov({ accion: 'terminar', enlace: ' https://xangarro.mx ' }),
    );
    assert.equal(fin.tipo, 'terminada');
    assert.equal(fin.enlace, 'https://xangarro.mx');
    assert.equal(fin.fecha, '2026-11-12');
  });

  it('a file is evidence as much as a link', () => {
    const fin = eventoDeMovimiento(tarjeta(), mov({ accion: 'terminar', documentoId: 'd1' }));
    assert.equal(fin.documentoId, 'd1');
  });

  it('refuses to finish without evidence, or with a link that is not one', () => {
    assert.throws(
      () => eventoDeMovimiento(tarjeta(), mov({ accion: 'terminar' })),
      codigo('EVIDENCIA'),
    );
    assert.throws(
      () => eventoDeMovimiento(tarjeta(), mov({ accion: 'terminar', enlace: 'mi carpeta' })),
      codigo('EVIDENCIA'),
    );
  });

  it('only the owner starts or finishes it', () => {
    assert.throws(
      () => eventoDeMovimiento(tarjeta(), mov({ socio: 2 })),
      codigo('SOLO_RESPONSABLE'),
    );
  });

  it('a card without a value, or waiting for a quote, cannot start', () => {
    const sinValor = tarjeta({ valores: { 1: 40_000_00n, 2: null } });
    assert.throws(() => eventoDeMovimiento(sinValor, mov({})), codigo('TARJETA_SIN_VALOR'));
    const radio = tarjeta({ valores: { 1: 10_000_00n, 2: 40_000_00n } });
    assert.throws(() => eventoDeMovimiento(radio, mov({})), codigo('TARJETA_SIN_VALOR'));
  });

  it('the other partner accepts or objects inside the window, never the owner', () => {
    assert.equal(
      eventoDeMovimiento(enRevision, mov({ accion: 'aceptar', socio: 2 })).tipo,
      'aceptada',
    );
    const o = eventoDeMovimiento(
      enRevision,
      mov({ accion: 'objetar', socio: 2, motivo: ' Falta el video. ' }),
    );
    assert.equal(o.motivo, 'Falta el video.');
    assert.throws(
      () => eventoDeMovimiento(enRevision, mov({ accion: 'aceptar', socio: 1 })),
      codigo('SOLO_EL_OTRO'),
    );
  });

  it('an objection names what is missing', () => {
    assert.throws(
      () => eventoDeMovimiento(enRevision, mov({ accion: 'objetar', socio: 2, motivo: '  ' })),
      codigo('MOTIVO'),
    );
  });

  it('after the window the silence already accepted it', () => {
    assert.throws(
      () =>
        eventoDeMovimiento(
          enRevision,
          mov({ accion: 'objetar', socio: 2, motivo: 'x', hoy: '2026-11-23' }),
        ),
      codigo('PLAZO_VENCIDO'),
    );
  });

  it('an objected card is marked again by its owner, or goes to the mediator', () => {
    const otraVez = eventoDeMovimiento(
      objetada,
      mov({ accion: 'terminar', enlace: 'https://a.mx' }),
    );
    assert.equal(otraVez.tipo, 'terminada');
    const med = eventoDeMovimiento(
      objetada,
      mov({ accion: 'mediador', socio: 2, motivo: 'Está en egresos.' }),
    );
    assert.equal(med.tipo, 'al_mediador');
    assert.throws(
      () => eventoDeMovimiento(enRevision, mov({ accion: 'mediador', motivo: 'x' })),
      codigo('TARJETA_ESTADO'),
    );
  });

  it("the ruling needs the mediator's document", () => {
    const conMediador = tarjeta({
      eventos: [...objetada.eventos, ev('al_mediador', '2026-11-20', 1)],
    });
    const r = eventoDeMovimiento(
      conMediador,
      mov({ accion: 'resolver', documentoId: 'd9', aceptada: true }),
    );
    assert.equal(r.tipo, 'resuelta');
    assert.equal(r.aceptada, true);
    assert.throws(
      () => eventoDeMovimiento(conMediador, mov({ accion: 'resolver', aceptada: false })),
      codigo('MEDIADOR_DOCUMENTO'),
    );
  });

  it('a task is done by its owner, and never reviewed', () => {
    const tarea = tarjeta({ tipo: 'tarea', valores: { 1: null, 2: null } });
    assert.equal(eventoDeMovimiento(tarea, mov({ accion: 'hacer' })).tipo, 'hecha');
    assert.throws(
      () => eventoDeMovimiento(tarea, mov({ accion: 'terminar', enlace: 'https://a.mx' })),
      codigo('TARJETA_ESTADO'),
    );
  });

  it('a long or hostile link is refused at once, not after a slow match', () => {
    const largo = `https://${'a.'.repeat(30_000)}`;
    const inicio = performance.now();
    assert.throws(
      () => eventoDeMovimiento(tarjeta(), mov({ accion: 'terminar', enlace: largo })),
      codigo('EVIDENCIA'),
    );
    assert.ok(performance.now() - inicio < 50);
    const sinPunto = `https://${'a'.repeat(2_000)}`;
    assert.throws(
      () => eventoDeMovimiento(tarjeta(), mov({ accion: 'terminar', enlace: sinPunto })),
      codigo('EVIDENCIA'),
    );
  });

  it('a card of the next plan does not move before its quarter starts', () => {
    const siguiente = tarjeta({ trimestre: '2027-T1', vence: '2027-02-01' });
    assert.throws(
      () => eventoDeMovimiento(siguiente, mov({ hoy: '2026-12-20' })),
      codigo('TARJETA_AUN_NO'),
    );
    assert.equal(eventoDeMovimiento(siguiente, mov({ hoy: '2027-01-02' })).tipo, 'iniciada');
  });

  it("a card taken off this quarter's plan does not move", () => {
    const fuera = tarjeta({ descartadaEn: '2026-T4' });
    assert.throws(() => eventoDeMovimiento(fuera, mov({})), codigo('TARJETA_DESCARTADA'));
  });
});
