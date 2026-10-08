import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import {
  cargaDeCierre,
  cierreDeFilas,
  comoCierre,
  estadoDelConteo,
  type FilasCierre,
} from '../src/cierre/vivo';
import { CHIP_CIERRE, segundaLinea, tituloHecho } from '../src/cierre/copy';
import { CIERRE_FIXTURE, CONTEO_CUADRA, CONTEO_FALTA, CONTEO_SOBRA } from '../src/cierre/fixture';
import { kpisMiTurno } from '../src/turno/kpis';
import { TURNO_FIXTURE } from '../src/turno/fixture';

/** One Efectivo venta of $19.80 (two lines) and one cancelled Tarjeta venta. */
const FILAS: FilasCierre = {
  turno: {
    id: 't1',
    aperturaAt: '2026-10-06T14:15:00.000Z',
    montoAperturaCentavos: 80_000n,
    efectivoAdicionalCentavos: 0n,
  },
  delTurno: [
    {
      id: 'tk1',
      cajaTurnoId: 't1',
      metodo: 'Efectivo',
      estadoPago: 'pagado',
      cancelledAt: null,
      deletedAt: null,
    },
    {
      id: 'tk2',
      cajaTurnoId: 't1',
      metodo: 'Tarjeta',
      estadoPago: 'pagado',
      cancelledAt: '2026-10-06T15:00:00.000Z',
      deletedAt: null,
    },
  ],
  lineas: [
    { ticketId: 'tk1', monto: 12_000n, deletedAt: null },
    { ticketId: 'tk1', monto: 7_800n, deletedAt: null },
    { ticketId: 'tk2', monto: 5_000n, deletedAt: null },
  ],
  abonos: [
    { metodo: 'Efectivo', montoCentavos: 40_000n, deletedAt: null },
    { metodo: 'Transferencia', montoCentavos: 10_000n, deletedAt: null },
  ],
  gastos: [{ cajaTurnoId: 't1', monto: 62_000n, deletedAt: null }],
};

describe('cierreDeFilas', () => {
  it('derives the four parts and the esperado with the one calculator', () => {
    const c = cierreDeFilas(FILAS);
    assert.equal(c.fondoCentavos, '80000');
    assert.equal(c.ventasEfectivoCentavos, '19800');
    assert.equal(c.abonosEfectivoCentavos, '40000');
    assert.equal(c.gastosEfectivoCentavos, '62000');
    assert.equal(c.esperadoCentavos, String(80_000n + 19_800n + 40_000n - 62_000n));
  });

  it('counts only the standing tickets in the resumen', () => {
    const r = cierreDeFilas(FILAS).resumen;
    assert.equal(r.ventas, 1);
    assert.equal(r.canceladas, 1);
    assert.equal(r.cobradoCentavos, '19800');
    assert.equal(r.canceladoCentavos, '5000');
  });

  it('the fixture counts land where the board says: cuadra, falta $70, sobra $910', () => {
    const e = estadoDelConteo({}, CIERRE_FIXTURE.partes, null, '');
    assert.equal(e.esperado, 271_000n);
    assert.equal(estadoDelConteo(CONTEO_CUADRA, CIERRE_FIXTURE.partes, null, '').contado, 271_000n);
    assert.deepEqual(estadoDelConteo(CONTEO_FALTA, CIERRE_FIXTURE.partes, null, '').dif, {
      tipo: 'falta',
      monto: 7_000n,
    });
    assert.deepEqual(estadoDelConteo(CONTEO_SOBRA, CIERRE_FIXTURE.partes, null, '').dif, {
      tipo: 'sobra',
      monto: 91_000n,
    });
  });
});

describe('estadoDelConteo', () => {
  it('a cuadra count closes; a difference waits for its motivo', () => {
    const bien = estadoDelConteo(CONTEO_CUADRA, CIERRE_FIXTURE.partes, null, '');
    assert.equal(bien.dif.tipo, 'cuadra');
    assert.equal(bien.puede, true);
    const mal = estadoDelConteo(CONTEO_FALTA, CIERRE_FIXTURE.partes, null, '');
    assert.equal(mal.faltaMotivo, true);
    assert.equal(mal.puede, false);
  });

  it('«Otra razón» also waits for its note', () => {
    const sinNota = estadoDelConteo(CONTEO_FALTA, CIERRE_FIXTURE.partes, 'Otra razón', '  ');
    assert.equal(sinNota.faltaNota, true);
    assert.equal(sinNota.puede, false);
    const conNota = estadoDelConteo(
      CONTEO_FALTA,
      CIERRE_FIXTURE.partes,
      'Otra razón',
      ' Se cayó el sobre ',
    );
    assert.equal(conNota.puede, true);
  });
});

describe('cargaDeCierre', () => {
  it('maps the motivo onto the domain enum by direction (D6)', () => {
    const falta = cargaDeCierre({
      tipo: 'falta',
      motivo: 'Cambio mal dado',
      nota: 'lo que sea',
      contado: 264_000n,
      conteo: CONTEO_FALTA,
    });
    assert.equal(falta.discrepancyReason, 'error-en-cambio');
    assert.equal(falta.explicacion, null);
    assert.equal(falta.montoCierreCentavos, 264_000n);
    assert.deepEqual(falta.denominaciones, { ...CONTEO_FALTA });
  });

  it('«Otra razón» carries the trimmed note; a cuadra close carries nothing', () => {
    const otra = cargaDeCierre({
      tipo: 'sobra',
      motivo: 'Otra razón',
      nota: ' Cobre de más ',
      contado: 362_000n,
      conteo: CONTEO_SOBRA,
    });
    assert.equal(otra.discrepancyReason, 'sobrante');
    assert.equal(otra.explicacion, 'Cobre de más');
    const cuadra = cargaDeCierre({
      tipo: 'cuadra',
      motivo: 'Salió un vale',
      nota: 'ignorada',
      contado: 271_000n,
      conteo: CONTEO_CUADRA,
    });
    assert.equal(cuadra.discrepancyReason, null);
    assert.equal(cuadra.explicacion, null);
  });

  it('a shortfall explained as «Venta no registrada» resolves to otro, not sobrante', () => {
    const x = cargaDeCierre({
      tipo: 'falta',
      motivo: 'Venta no registrada',
      nota: '',
      contado: 0n,
      conteo: {},
    });
    assert.equal(x.discrepancyReason, 'otro');
  });
});

describe('comoCierre y el cierre dicho', () => {
  it('shapes the live read as the screen data, money as centavos bigints', () => {
    const d = comoCierre(cierreDeFilas(FILAS), {
      operador: 'Ana Robledo',
      caja: 'Caja 1',
      hasta: '21:04',
      dueno: 'Pedro',
      negocio: 'Taquería Don Pedro',
    });
    assert.equal(d.operador, 'Ana Robledo');
    assert.equal(d.negocio, 'Taquería Don Pedro');
    assert.equal(d.hasta, '21:04');
    assert.equal(d.partes.fondo, 80_000n);
    assert.equal(d.partes.abonosEfectivo, 40_000n);
    assert.equal(d.resumen.cobrado, 19_800n);
    assert.deepEqual(d.conteo, {});
  });

  it('words the done screen: title, chip and second line by difference', () => {
    assert.equal(tituloHecho({ tipo: 'cuadra', monto: 0n }), '¡Turno cerrado!');
    assert.equal(tituloHecho({ tipo: 'falta', monto: 1n }), 'Turno cerrado');
    assert.equal(CHIP_CIERRE.sobra, 'Sobrante');
    assert.equal(segundaLinea({ tipo: 'cuadra', monto: 0n }), 'Cuadró al centavo.');
    assert.equal(segundaLinea({ tipo: 'falta', monto: 70_00n }), 'Con un faltante de $70.00.');
    assert.equal(segundaLinea({ tipo: 'sobra', monto: 910_00n }), 'Con un sobrante de $910.00.');
  });

  it('says Mi turno’s four figures, hints included', () => {
    const k = kpisMiTurno(TURNO_FIXTURE);
    assert.deepEqual(
      k.map((x) => [x.label, x.value]),
      [
        ['Ventas', '12'],
        ['Cobrado', '$3,120.00'],
        ['Fiado', '$182.00'],
        ['Gastos', '$620.00'],
      ],
    );
    assert.equal(k[0]?.hint, 'Una cancelada a las 12:58');
    assert.equal(k[2]?.hint, 'Dos clientes');
    assert.equal(k[3]?.hint, 'Salieron de la caja · 4 comprobantes');
  });
});
