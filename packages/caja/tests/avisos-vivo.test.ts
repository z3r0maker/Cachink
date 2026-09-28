import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { AvisosPara } from '../src/lectura/cola-shapes';
import { hoyLocal } from '../src/comun/fechas';
import {
  avisosVivos,
  cuando,
  deDueno,
  diaLargo,
  mayuscula,
  partir,
  sinLeer,
} from '../src/avisos/vivo';
import { nombreDueno, primerNombreDueno } from '../src/comun/dueno';

const HOY = '2026-05-14';
/** Noon local on a day, as a UTC stamp: safe from any device's offset. */
const local = (dia: string, hhmm = '12:00') => new Date(`${dia}T${hhmm}:00`).toISOString();

const BASE: AvisosPara = {
  mensajes: [],
  leidos: [],
  cola: { cuantos: 0, desde: null },
  rechazados: 0,
  stockBajo: [],
  dueno: null,
};

describe('avisos, vivos', () => {
  it('says days and times as the cards do', () => {
    assert.equal(diaLargo('2026-05-13'), '13 de mayo');
    assert.equal(cuando(local(HOY, '09:12'), HOY), 'Hoy 09:12');
    assert.equal(cuando(local('2026-05-13', '19:40'), HOY), 'Ayer 19:40');
    assert.equal(cuando(local('2026-05-02', '08:00'), HOY), '2 may 08:00');
  });

  it('an aclaración asks for a reply about its corte; an info splits title and body', () => {
    const data = avisosVivos(
      {
        ...BASE,
        mensajes: [
          {
            id: 'M1',
            severidad: 'aclaracion',
            cuerpo: 'Faltaron $60.00 al cerrar.',
            creado: local(HOY, '09:12'),
            corte: '2026-05-13',
            respuesta: null,
          },
          {
            id: 'M2',
            severidad: 'info',
            cuerpo: 'La gringa sube a $65.00 desde mañana. Es por el queso.',
            creado: local(HOY),
            corte: null,
            respuesta: null,
          },
        ],
      },
      HOY,
    );
    const [corte, info] = data.avisos;
    assert.equal(data.dueno, 'el dueño');
    assert.equal(corte?.titulo, 'Aclara el corte del 13 de mayo');
    assert.deepEqual(corte?.responder, { asunto: 'el corte del 13 de mayo' });
    assert.equal(corte?.tono, 'alerta');
    assert.equal(corte?.leido, false);
    assert.equal(info?.titulo, 'La gringa sube a $65.00 desde mañana.');
    assert.equal(info?.cuerpo, 'Es por el queso.');
    assert.equal(info?.responder, undefined);
  });

  it('a replied or marked message is read; the reply shows', () => {
    const data = avisosVivos(
      {
        ...BASE,
        leidos: ['M2'],
        mensajes: [
          {
            id: 'M1',
            severidad: 'aclaracion',
            cuerpo: '¿Qué pasó?',
            creado: local(HOY),
            corte: null,
            respuesta: 'No sé qué pasó.',
          },
          {
            id: 'M2',
            severidad: 'info',
            cuerpo: 'Hola',
            creado: local(HOY),
            corte: null,
            respuesta: null,
          },
        ],
      },
      HOY,
    );
    assert.equal(data.avisos[0]?.titulo, 'Aclara un corte');
    assert.equal(data.avisos[0]?.respuesta, 'No sé qué pasó.');
    assert.equal(sinLeer(data.avisos), 0);
  });

  it('the caja speaks of its real queue, refused rows and low stock', () => {
    const data = avisosVivos(
      {
        ...BASE,
        leidos: ['rechazados:2'],
        cola: { cuantos: 1, desde: local(HOY, '14:55') },
        rechazados: 2,
        stockBajo: [{ id: 'P1', nombre: 'Taco de tripa', existencias: 6, umbral: 15 }],
      },
      HOY,
    );
    assert.deepEqual(
      data.avisos.map((x) => [x.grupo, x.titulo, x.leido]),
      [
        ['caja', '1 registro sigue sin enviarse', false],
        ['caja', '2 registros no se pudieron enviar', true],
        ['caja', 'Taco de tripa está por debajo del umbral', false],
      ],
    );
    assert.equal(data.avisos[0]?.hora, 'Hoy 14:55');
    assert.equal(
      data.avisos[2]?.cuerpo,
      'Quedan 6 y el umbral es 15. Si llega mercancía, registra la entrada para que el stock cuadre.',
    );
    assert.equal(sinLeer(data.avisos), 2);
  });

  it('an empty caja has nothing to say', () => {
    assert.deepEqual(avisosVivos(BASE, hoyLocal()).avisos, []);
  });

  it('words the owner with or without a name', () => {
    assert.equal(mayuscula(deDueno('el dueño')), 'Del dueño');
    assert.equal(mayuscula(deDueno('Pedro')), 'De Pedro');
    assert.deepEqual(partir('Sin punto final'), { titulo: 'Sin punto final', resto: '' });
  });

  it('names the owner by the first name the pull sent, «el dueño» until then', () => {
    assert.equal(avisosVivos({ ...BASE, dueno: 'Pedro Ramírez' }, HOY).dueno, 'Pedro');
    assert.equal(avisosVivos({ ...BASE, dueno: '   ' }, HOY).dueno, 'el dueño');
    assert.equal(nombreDueno(null), 'el dueño');
    assert.equal(primerNombreDueno('  Lupita  '), 'Lupita');
    assert.equal(primerNombreDueno(null), null);
  });
});
