import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import type { Aviso } from '../src/avisos/types';
import type { Existencia } from '../src/inventario/types';
import { TURNO_FIXTURE } from '../src/turno/fixture';
import {
  abonosDelTurno,
  chipAvisos,
  chipGastos,
  chipPorEnviar,
  chipReponer,
  detalleFiado,
  detalleGastos,
  detalleReponer,
  filasDelTurno,
  lineaAvisos,
} from '../src/turno/filas';
import type { PendienteRecurrente } from '../src/turno/types';

const pendiente = (id: string, nombre: string, vence: number): PendienteRecurrente => ({
  id,
  nombre,
  detalle: 'Cada semana',
  monto: 62_000n,
  vence,
});

const existencia = (corto: string, existencias: number, umbral: number): Existencia => ({
  id: corto,
  nombre: corto,
  corto,
  existencias,
  umbral,
  unidad: 'piezas',
  icono: 'taco' as Existencia['icono'],
  tint: '#FFFFFF',
});

const aviso = (id: string, titulo: string, leido: boolean): Aviso => ({
  id,
  grupo: 'dueno',
  tipo: 'Mensaje de los patrones',
  titulo,
  cuerpo: '',
  hora: 'Hoy 09:12',
  icono: '',
  tono: 'dueno',
  leido,
});

describe('Lo de tu turno · Gastos', () => {
  it('says what left the drawer and how many receipts came with it', () => {
    assert.equal(detalleGastos(62_000n, 4), '$620.00 salieron de la caja · 4 comprobantes');
  });

  it('one receipt is singular, none says so', () => {
    assert.equal(detalleGastos(62_000n, 1), '$620.00 salieron de la caja · 1 comprobante');
    assert.equal(detalleGastos(62_000n, 0), '$620.00 salieron de la caja · sin comprobantes');
  });

  it('nothing out of the drawer says so, with no receipt count', () => {
    assert.equal(detalleGastos(0n, 0), 'Nada ha salido de la caja');
  });

  it('a due recurrente is named in a red chip; a late one says how late', () => {
    assert.deepEqual(chipGastos([pendiente('gas', 'Gas', 0)]), {
      label: 'Gas vence hoy',
      tone: 'red',
    });
    assert.deepEqual(chipGastos([pendiente('agua', 'Agua', -3)]), {
      label: 'Atrasado 3 días',
      tone: 'red',
    });
  });

  it('several due are counted, and none leaves no chip', () => {
    assert.deepEqual(chipGastos(TURNO_FIXTURE.pendientes), { label: '3 por pagar', tone: 'red' });
    assert.equal(chipGastos([]), null);
  });
});

describe('Lo de tu turno · Fiado y abonos', () => {
  it('sums every abono of the turno, whatever the method', () => {
    assert.equal(abonosDelTurno(TURNO_FIXTURE.movimientos), 40_000n);
  });

  it('no abonos sum to zero, and sales or gastos never count', () => {
    assert.equal(abonosDelTurno([]), 0n);
    assert.equal(abonosDelTurno(TURNO_FIXTURE.movimientos.filter((m) => m.tipo !== 'abono')), 0n);
  });

  it('says the fiado and the abonos of today', () => {
    assert.equal(detalleFiado(18_200n, 55_000n), '$182.00 fiado hoy · $550.00 en abonos');
  });

  it('zeros still say both figures', () => {
    assert.equal(detalleFiado(0n, 0n), '$0.00 fiado hoy · $0.00 en abonos');
  });
});

describe('Lo de tu turno · Inventario', () => {
  const items = [
    existencia('pastor', 2, 5),
    existencia('tortilla', 50, 10),
    existencia('queso oaxaca', 0, 1),
  ];

  it('names what to restock and counts it in an amber chip', () => {
    assert.equal(detalleReponer(items), 'Pastor y queso oaxaca');
    assert.deepEqual(chipReponer(items), { label: '2 por reponer', tone: 'amber' });
  });

  it('nothing under its threshold says so, with no chip', () => {
    const arriba = [existencia('tortilla', 50, 10)];
    assert.equal(detalleReponer(arriba), 'Todo está arriba de su aviso');
    assert.equal(chipReponer(arriba), null);
  });

  it('no stocked products, or a read not yet in, keeps the row’s own line', () => {
    assert.equal(detalleReponer([]), null);
    assert.equal(detalleReponer(undefined), null);
    assert.equal(chipReponer(undefined), null);
  });
});

describe('Lo de tu turno · Avisos', () => {
  const avisos = [aviso('a1', 'Aclara el corte del 13 de mayo', false), aviso('a2', 'Hola.', true)];

  it('says the newest unread message and counts the unread in a yellow chip', () => {
    assert.equal(lineaAvisos(avisos), 'Aclara el corte del 13 de mayo');
    assert.deepEqual(chipAvisos(avisos), { label: '1 sin leer', tone: 'yellow' });
  });

  it('with everything read, the newest message and no chip', () => {
    const leidos = avisos.map((a) => ({ ...a, leido: true }));
    assert.equal(lineaAvisos(leidos), 'Aclara el corte del 13 de mayo');
    assert.equal(chipAvisos(leidos), null);
  });

  it('an unread message further down wins over a read newer one', () => {
    const mezcla = [aviso('a3', 'Ya está.', true), aviso('a4', 'Sube la gringa.', false)];
    assert.equal(lineaAvisos(mezcla), 'Sube la gringa.');
  });

  it('no messages say so; a read not yet in keeps the row’s own line', () => {
    assert.equal(lineaAvisos([]), 'Sin mensajes por ahora');
    assert.equal(lineaAvisos(undefined), null);
    assert.equal(chipAvisos(undefined), null);
  });
});

describe('Lo de tu turno · Registros por enviar', () => {
  it('everything sent is a green chip', () => {
    assert.deepEqual(chipPorEnviar(0), { label: 'Todo enviado', tone: 'green' });
  });

  it('rows waiting are counted in an amber chip', () => {
    assert.deepEqual(chipPorEnviar(1), { label: '1 por enviar', tone: 'amber' });
    assert.deepEqual(chipPorEnviar(12), { label: '12 por enviar', tone: 'amber' });
  });

  it('a negative or broken count reads as nothing waiting', () => {
    assert.deepEqual(chipPorEnviar(-1), { label: 'Todo enviado', tone: 'green' });
    assert.deepEqual(chipPorEnviar(Number.NaN), { label: 'Todo enviado', tone: 'green' });
  });
});

describe('Lo de tu turno · all the rows', () => {
  it('says every row from the turno and the reads beside it', () => {
    const f = filasDelTurno(TURNO_FIXTURE, {
      existencias: [existencia('pastor', 1, 5)],
      avisos: [aviso('a1', 'Aclara el corte.', false)],
      porEnviar: 0,
    });
    assert.equal(f.gastos.detail, '$620.00 salieron de la caja · 4 comprobantes');
    assert.deepEqual(f.gastos.chip, { label: '3 por pagar', tone: 'red' });
    assert.equal(f.fiado.detail, '$182.00 fiado hoy · $400.00 en abonos');
    assert.equal(f.fiado.chip, undefined);
    assert.equal(f.inventario.detail, 'Pastor');
    assert.deepEqual(f.inventario.chip, { label: '1 por reponer', tone: 'amber' });
    assert.equal(f.avisos.detail, 'Aclara el corte.');
    assert.deepEqual(f.avisos.chip, { label: '1 sin leer', tone: 'yellow' });
    assert.equal(f.pendientes.detail, undefined);
    assert.deepEqual(f.pendientes.chip, { label: 'Todo enviado', tone: 'green' });
  });

  it('with the side reads still out, those rows keep their own lines', () => {
    const f = filasDelTurno(TURNO_FIXTURE, { porEnviar: 2 });
    assert.equal(f.inventario.detail, undefined);
    assert.equal(f.inventario.chip, undefined);
    assert.equal(f.avisos.detail, undefined);
    assert.deepEqual(f.pendientes.chip, { label: '2 por enviar', tone: 'amber' });
  });

  it('with no turno, only the rows that need none say anything', () => {
    const f = filasDelTurno(null, { porEnviar: 0, avisos: [] });
    assert.equal(f.gastos.detail, undefined);
    assert.equal(f.fiado.detail, undefined);
    assert.equal(f.avisos.detail, 'Sin mensajes por ahora');
    assert.deepEqual(f.pendientes.chip, { label: 'Todo enviado', tone: 'green' });
  });
});
