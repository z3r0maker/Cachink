import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { hhmmLocal } from '../src/comun/fechas';
import type { PendienteCrudo } from '../src/lectura/cola-shapes';
import { heroe, intro, suman } from '../src/pendientes/derive';
import { comoRegistro, detalleVenta } from '../src/pendientes/vivo';

const EN = '2026-05-14T20:52:00.000Z';

const venta: PendienteCrudo = {
  tipo: 'venta',
  id: 'T1',
  en: EN,
  folio: 412,
  hora: '14:52',
  metodo: 'Efectivo',
  lineas: [
    { concepto: 'pastor', cantidad: 3 },
    { concepto: 'gringa', cantidad: 1 },
    { concepto: 'horchata', cantidad: 1 },
  ],
  totalCentavos: '16000',
  cancelada: false,
};

describe('registros por enviar, vivos', () => {
  it('says a sale as the design does: folio, lines, method, total, its own time', () => {
    assert.deepEqual(comoRegistro(venta), {
      id: 'venta:T1',
      tipo: 'venta',
      titulo: 'Venta V-0412',
      detalle: '3 pastor · 1 gringa · 1 horchata · efectivo',
      monto: 160_00n,
      hora: '14:52',
    });
  });

  it('names three lines and counts the rest; a cancelled sale says so', () => {
    const lineas = [1, 2, 3, 4, 5].map((n) => ({ concepto: `p${n}`, cantidad: n }));
    assert.equal(detalleVenta(lineas, 'Tarjeta'), '1 p1 · 2 p2 · 3 p3 · y 2 más · tarjeta');
    assert.equal(comoRegistro({ ...venta, cancelada: true }).titulo, 'Venta V-0412 · cancelada');
  });

  it('says gastos, abonos and movements, in the device time of their stamp', () => {
    const gasto = comoRegistro({
      tipo: 'gasto',
      id: 'G1',
      en: EN,
      concepto: 'Gas',
      montoCentavos: '62000',
      proveedor: null,
    });
    assert.equal(gasto.titulo, 'Gasto · Gas');
    assert.equal(gasto.detalle, 'Gasto de caja chica');
    assert.equal(gasto.monto, 620_00n);
    assert.equal(gasto.hora, hhmmLocal(EN));
    const abono = comoRegistro({
      tipo: 'abono',
      id: 'A1',
      en: EN,
      cliente: 'El Taller de Chuy',
      montoCentavos: '20000',
      metodo: 'Efectivo',
    });
    assert.equal(abono.titulo, 'Abono · El Taller de Chuy');
    assert.equal(abono.detalle, 'En efectivo');
    const apertura = comoRegistro({
      tipo: 'movimiento',
      id: 'C1',
      en: EN,
      clase: 'apertura',
      texto: null,
      montoCentavos: '50000',
    });
    assert.equal(apertura.titulo, 'Apertura de caja');
    assert.equal(apertura.monto, 500_00n);
  });

  it('folds the inventory ledger into one line, and a reply carries no money', () => {
    const inv = comoRegistro({
      tipo: 'movimiento',
      id: 'inventario',
      en: EN,
      clase: 'inventario',
      texto: null,
      montoCentavos: null,
      entradas: 1,
      salidas: 5,
    });
    assert.equal(inv.titulo, 'Movimientos de inventario');
    assert.equal(inv.detalle, '5 salidas · 1 entrada');
    assert.equal(inv.monto, null);
    const r = comoRegistro({
      tipo: 'movimiento',
      id: 'R1',
      en: EN,
      clase: 'respuesta',
      texto: 'Cobré una venta y no la capturé en la caja.',
      montoCentavos: null,
    });
    assert.equal(r.titulo, 'Respuesta al dueño');
    assert.equal(r.detalle, '“Cobré una venta y no la capturé en la caja.”');
  });

  it('words one record in the singular, and a queue without sales or gastos without sums', () => {
    const uno = [comoRegistro(venta)];
    assert.equal(heroe('espera', uno, 1).titulo, '1 registro espera conexión');
    assert.equal(heroe('enviando', uno, 1).titulo, 'Enviando 1 registro…');
    const apertura = comoRegistro({
      tipo: 'movimiento',
      id: 'C1',
      en: EN,
      clase: 'apertura',
      texto: null,
      montoCentavos: '50000',
    });
    assert.equal(suman([apertura]), '');
    assert.equal(
      heroe('espera', [apertura], 1).cuerpo,
      'Puedes seguir cobrando; se envían solos cuando vuelva el internet.',
    );
  });

  it('a linked caja names no owner: «el portal del dueño»', () => {
    assert.equal(intro(true, null), 'Tu caja está al día con el portal del dueño');
    assert.equal(intro(true), 'Tu caja está al día con el portal de Pedro');
  });
});
