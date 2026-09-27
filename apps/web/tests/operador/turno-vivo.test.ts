import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { heroFor, saludo } from '../../src/operador/inicio/copy';
import { INICIO_FIXTURE } from '../../src/operador/inicio/fixture';
import {
  comoInicio,
  comoTarea,
  etiquetaCorte,
  fechaInicio,
  haceCuanto,
  primerNombre,
  resultadoDe,
  situacionDe,
} from '../../src/operador/inicio/vivo';
import { hhmmLocal } from '../../src/operador/runtime/fechas';
import { detalleDelTurno, type FilasDetalle } from '../../src/operador/runtime/turno-detalle';
import type { RecurrentePara, TurnoVivoPara } from '../../src/operador/runtime/turno-shapes';
import { comoTurno, detalleRecurrente, notaFiado } from '../../src/operador/turno/vivo';

const T = (h: string) => `2026-09-26T${h}:00.000Z`;

/** One turno: a cash sale, a card sale, a fiado, a cancelled cash sale, a gasto, an abono. */
const FILAS: FilasDetalle = {
  delTurno: [
    {
      id: 't1',
      folio: 1,
      metodo: 'Efectivo',
      clienteId: null,
      cancelledAt: null,
      createdAt: T('15:00'),
    },
    {
      id: 't2',
      folio: 2,
      metodo: 'Tarjeta',
      clienteId: null,
      cancelledAt: null,
      createdAt: T('15:10'),
    },
    {
      id: 't3',
      folio: 3,
      metodo: 'Crédito',
      clienteId: 'c1',
      cancelledAt: null,
      createdAt: T('15:20'),
    },
    {
      id: 't4',
      folio: 4,
      metodo: 'Efectivo',
      clienteId: null,
      cancelledAt: T('15:40'),
      createdAt: T('15:30'),
    },
  ],
  lineas: [
    { ticketId: 't1', concepto: 'Orden del día', cantidad: 2, monto: 8_000n, deletedAt: null },
    { ticketId: 't2', concepto: 'Refresco', cantidad: 1, monto: 2_500n, deletedAt: null },
    { ticketId: 't3', concepto: 'Consomé', cantidad: 1, monto: 9_000n, deletedAt: null },
    { ticketId: 't4', concepto: 'Refresco', cantidad: 1, monto: 2_500n, deletedAt: null },
    { ticketId: 't1', concepto: 'Borrada', cantidad: 1, monto: 99_900n, deletedAt: T('15:01') },
  ],
  abonos: [
    {
      id: 'a1',
      clienteId: 'c2',
      metodo: 'Efectivo',
      montoCentavos: 40_000n,
      createdAt: T('15:50'),
      deletedAt: null,
    },
  ],
  gastos: [{ id: 'g1', concepto: 'Gas', proveedor: null, monto: 62_000n, createdAt: T('15:45') }],
};
const NOMBRES = new Map([
  ['c1', 'Doña Mari'],
  ['c2', 'Taller de Chuy'],
]);

describe('the open turno, live (runtime detail)', () => {
  const d = detalleDelTurno(FILAS, NOMBRES);

  it('sums standing tickets per method, the fiado under Fiado', () => {
    assert.deepEqual(d.porMetodo, {
      Efectivo: '8000',
      Tarjeta: '2500',
      Transferencia: '0',
      Fiado: '9000',
    });
    assert.deepEqual(d.fiadoClientes, ['Doña Mari']);
    assert.equal(d.gastos, 1);
  });

  it('knows the last cancellation and the last standing sale', () => {
    assert.equal(d.ultimaCancelada, hhmmLocal(T('15:40')));
    assert.equal(d.ultimaVentaAt, T('15:20'));
  });

  it('lists movements newest first, without the cancelled sale', () => {
    assert.deepEqual(
      d.movimientos.map((m) => [m.tipo, m.titulo, m.montoCentavos]),
      [
        ['abono', 'Abono · Taller de Chuy', '40000'],
        ['gasto', 'Gasto · Gas', '-62000'],
        ['credito', 'Venta V-0003', '9000'],
        ['venta', 'Venta V-0002', '2500'],
        ['venta', 'Venta V-0001', '8000'],
      ],
    );
    const [, , fiado, tarjeta, efectivo] = d.movimientos;
    assert.equal(fiado?.detalle, '1 Consomé · fiado a Doña Mari');
    assert.equal(tarjeta?.detalle, '1 Refresco · tarjeta');
    assert.equal(efectivo?.detalle, '2 Orden del día');
  });
});

const RENTA: RecurrentePara = {
  id: 'r1',
  concepto: 'Renta del local',
  frecuencia: 'mensual',
  diaDelMes: 15,
  proveedor: null,
  montoCentavos: '850000',
  vence: 0,
};

/** A turno with fondo $500 and one cash sale of $80. */
const VIVO: TurnoVivoPara = {
  cierre: {
    desde: '14:05',
    cerrado: false,
    fondoCentavos: '50000',
    ventasEfectivoCentavos: '8000',
    abonosEfectivoCentavos: '0',
    gastosEfectivoCentavos: '0',
    esperadoCentavos: '58000',
    resumen: {
      ventas: 1,
      cobradoCentavos: '8000',
      canceladas: 0,
      canceladoCentavos: '0',
      fiadoCentavos: '0',
      entradas: 0,
      mermas: 0,
    },
  },
  aperturaAt: '2026-09-26T20:05:00.000Z',
  porMetodo: { Efectivo: '8000', Tarjeta: '0', Transferencia: '0', Fiado: '0' },
  fiadoClientes: [],
  ultimaCancelada: null,
  ultimaVentaAt: '2026-09-26T20:30:00.000Z',
  gastos: 0,
  movimientos: [],
  recurrentes: [RENTA],
  cortes: [{ fecha: '2026-09-25', diferenciaCentavos: '-6000' }],
};

describe('Mi turno over the live read', () => {
  it('maps the close figures and the parts', () => {
    const t = comoTurno(VIVO, 'Ana Robledo', 'Caja 1');
    assert.equal(t.operador, 'Ana Robledo');
    assert.equal(t.esperado, 58_000n);
    assert.equal(t.fondo, 50_000n);
    assert.equal(t.ventas, 1);
    assert.equal(t.comprobantes, 0);
    assert.deepEqual(
      t.porMetodo.map((m) => [m.metodo, m.monto]),
      [
        ['Efectivo', 8_000n],
        ['Tarjeta', 0n],
        ['Transferencia', 0n],
        ['Fiado', 0n],
      ],
    );
    assert.deepEqual(t.pendientes, [
      {
        id: 'r1',
        nombre: 'Renta del local',
        detalle: 'Cada mes · día 15',
        monto: 850_000n,
        vence: 0,
      },
    ]);
  });

  it('words who took fiado and how a recurring expense repeats', () => {
    assert.equal(notaFiado([]), 'nadie se llevó fiado');
    assert.equal(notaFiado(['Doña Mari']), 'Doña Mari');
    assert.equal(notaFiado(['Doña Mari', 'Chuy']), 'Doña Mari y otro cliente');
    assert.equal(notaFiado(['A', 'B', 'C', 'D']), 'A y 3 clientes más');
    assert.equal(
      detalleRecurrente({
        ...RENTA,
        frecuencia: 'semanal',
        diaDelMes: null,
        proveedor: 'Gas Express',
      }),
      'Cada semana · Gas Express',
    );
  });
});

describe('Inicio over the live read', () => {
  const ahora = new Date(2026, 8, 26, 15, 0);

  it('says the operator first name, the date and the business', () => {
    assert.equal(primerNombre('Ana Robledo'), 'Ana');
    assert.equal(
      fechaInicio(ahora, 'La Esquina', 'Caja 1'),
      'Sábado 26 de septiembre · La Esquina, Caja 1',
    );
    assert.equal(fechaInicio(ahora, null, 'Caja 1'), 'Sábado 26 de septiembre · Caja 1');
  });

  it('says how long ago, and how a close ended', () => {
    const hace = (min: number) => new Date(ahora.getTime() - min * 60_000).toISOString();
    assert.equal(haceCuanto(hace(0), ahora), 'menos de un minuto');
    assert.equal(haceCuanto(hace(1), ahora), '1 minuto');
    assert.equal(haceCuanto(hace(6), ahora), '6 minutos');
    assert.equal(haceCuanto(hace(130), ahora), '2 horas');
    assert.deepEqual(resultadoDe(0n), { tipo: 'cuadro' });
    assert.deepEqual(resultadoDe(2_000n), { tipo: 'sobro', monto: 2_000n });
    assert.deepEqual(resultadoDe(-6_000n), { tipo: 'falto', monto: 6_000n });
    assert.equal(etiquetaCorte('2026-09-26', ahora, 'Caja 1'), 'Hoy · Caja 1');
    assert.equal(etiquetaCorte('2026-09-25', ahora, 'Caja 1'), 'Ayer · Caja 1');
    assert.equal(etiquetaCorte('2026-09-12', ahora, 'Caja 1'), '12 sep · Caja 1');
  });

  it('turns a due recurring expense into a task', () => {
    assert.deepEqual(comoTarea(RENTA), {
      id: 'r1',
      tipo: 'gasto',
      titulo: 'Registrar renta del local',
      detalle: 'Se repite cada mes · día 15',
      href: '/operador/gastos?recurrente=r1',
    });
  });

  it('builds the open turno with the live figures and no fixture', () => {
    const d = comoInicio(VIVO, {
      nombre: 'Luis Pérez',
      negocio: 'La Esquina',
      caja: 'Caja 1',
      offline: false,
      pendientes: 0,
      porCobrar: { monto: 0n, clientes: 0 },
      ahora: new Date('2026-09-26T20:36:00.000Z'),
      dueno: 'Pedro Ramírez',
      stock: [],
      cuentas: [],
    });
    assert.equal(d.nombre, 'Luis');
    assert.equal(d.situacion, 'vendiendo');
    assert.equal(d.turno?.esperado, 58_000n);
    assert.equal(d.turno?.ultimaVentaHace, '6 minutos');
    assert.deepEqual(d.mensajes, []);
    assert.equal(d.cortes[0]?.resultado.tipo, 'falto');
    const hola = { dia: 'Buenos días', tarde: 'Buenas tardes', noche: 'Buenas noches' };
    assert.equal(saludo(d), `¡${hola[d.momento ?? 'tarde']}, Luis! La caja está lista.`);
    assert.equal(d.dueno, 'Pedro');
    assert.equal(heroFor(d).body, 'Llevas 1 venta en este turno. La última fue hace 6 minutos.');
  });

  it('asks to close after twelve hours, and knows a closed turno', () => {
    const tarde = new Date('2026-09-27T08:10:00.000Z');
    assert.equal(situacionDe(VIVO, tarde), 'hora-de-cerrar');
    assert.equal(
      situacionDe({ ...VIVO, cierre: { ...VIVO.cierre, cerrado: true } }, tarde),
      'turno-cerrado',
    );
  });

  it('has an honest variant before the first sale', () => {
    const turno = INICIO_FIXTURE.turno;
    assert.ok(turno);
    const d = { ...INICIO_FIXTURE, turno: { ...turno, ventas: 0, ultimaVentaHace: '' } };
    assert.equal(
      heroFor(d).body,
      'Todavía no hay ventas en este turno. La primera se cobra desde aquí.',
    );
  });
});
