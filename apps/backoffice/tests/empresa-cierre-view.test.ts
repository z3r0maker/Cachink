import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import { pasosDelCierre } from '@xangarro/domain/corp';

import { encabezadoDe } from '../src/server/empresa/cierre-encabezado';
import { pasosVista } from '../src/server/empresa/cierre-pasos';
import {
  fuentesDe,
  hrefCierre,
  parseMesCierre,
  type DetalleCierre,
} from '../src/server/empresa/cierre-view';
import { cerrado, datos, enCurso, listo } from './cierre-fixture';

/** Cierre del mes's page as board CD-10 shows it (E-14). */
const vista = (d: DetalleCierre, cerradoMes = false) =>
  pasosVista(pasosDelCierre(fuentesDe(d)), d, '2026-10', cerradoMes);

const paso = (d: DetalleCierre, id: string) => {
  const p = vista(d).find((x) => x.id === id);
  if (p === undefined) throw new Error(`no step ${id}`);
  return p;
};

describe('the seven steps (board CD-10)', () => {
  it('words each done step as the board does', () => {
    assert.deepEqual(
      vista(listo).map((p) => [p.n, p.titulo, p.estado]),
      [
        [1, 'Factura global de octubre', 'hecho'],
        [2, 'Ingresos del mes', 'hecho'],
        [3, 'Facturas recibidas', 'hecho'],
        [4, 'Saldo del banco al 31 oct', 'hecho'],
        [5, 'ISR e IVA de octubre', 'hecho'],
        [6, 'El resto de la Agenda de octubre', 'hecho'],
        [7, 'Estados financieros del contador', 'hecho'],
      ],
    );
    assert.match(paso(listo, 'emitidas').detalle, /Timbrada · 31 pagos · \$12,480\.00/);
    assert.equal(
      paso(listo, 'recibidas').detalle,
      '12 gastos con su factura · 1 marcado no deducible',
    );
    assert.match(paso(listo, 'impuestos').detalle, /el pago cae en noviembre/);
    assert.match(paso(listo, 'agenda').detalle, /: al día · DIOT: exenta$/);
    assert.match(paso(listo, 'estados').detalle, /^balanza-octubre-2026\.pdf · subidos el 18 nov/);
  });

  it('leaves the bank to a founder, with its panel as the primary action', () => {
    const banco = paso(enCurso, 'banco');
    assert.equal(banco.estado, 'pendiente');
    assert.match(banco.detalle, /compáralo con el de aquí, \$48,210\.55/);
    assert.deepEqual(banco.accion, {
      texto: 'Confirmar saldo',
      href: '/empresa/cierre?mes=2026-10&panel=banco',
      primaria: true,
    });
    assert.equal(paso(enCurso, 'estados').subir, true);
  });

  it('names what is missing: the expenses without CFDI, a balance the ledger moved past', () => {
    const sin: DetalleCierre = {
      ...enCurso,
      recibidas: {
        gastos: 3,
        noDeducibles: 0,
        sinFactura: [
          { id: 'e1', concepto: 'Vercel', fecha: '2026-10-03' },
          { id: 'e2', concepto: 'Google', fecha: '2026-10-09' },
        ],
        porRevisar: 1,
      },
      banco: { consola: 48_193_15n, confirmado: 48_210_55n },
    };
    assert.equal(
      paso(sin, 'recibidas').detalle,
      'Falta: 2 gastos sin factura: Vercel, Google · 1 XML por revisar',
    );
    assert.match(paso(sin, 'banco').detalle, /ya no es el saldo de aquí \(\$48,193\.15\)/);
  });

  it('says «no aplica» without a link for a month with no sales or expenses', () => {
    const vacio: DetalleCierre = {
      ...listo,
      emitidas: { global: null, porEmitir: 0, pagos: 0, sinImportar: 0, cobradoSinIva: 0n },
      recibidas: { gastos: 0, noDeducibles: 0, sinFactura: [], porRevisar: 0 },
    };
    for (const id of ['emitidas', 'ingresos', 'recibidas']) {
      assert.equal(paso(vacio, id).estado, 'no_aplica');
      assert.equal(paso(vacio, id).accion, null);
    }
  });

  it('keeps only the links to look in a closed month', () => {
    const v = pasosVista(pasosDelCierre(fuentesDe(enCurso)), enCurso, '2026-10', true);
    assert.equal(v.find((p) => p.id === 'banco')?.accion, null);
    assert.equal(v.find((p) => p.id === 'estados')?.subir, false);
    assert.equal(v.find((p) => p.id === 'impuestos')?.accion?.texto, 'Ver en Impuestos');
  });
});

describe('the month’s header', () => {
  const enc = (d: ReturnType<typeof datos>, quien = 'f2') =>
    encabezadoDe(d, pasosDelCierre(fuentesDe(d.detalle)), quien);

  it('«En curso»: counts what is missing and disables «Cerrar» with the reason', () => {
    const e = enc(datos(enCurso));
    assert.equal(e.titulo, 'Faltan 2 pasos para cerrar octubre');
    assert.deepEqual(e.chip, { texto: 'Abierto · 5 de 7', tono: 'off' });
    assert.equal(e.puedeCerrar, false);
    assert.equal(e.cierreTexto, 'Faltan 2 pasos para cerrar octubre.');
  });

  it('«Listo para cerrar», unless an earlier month is still open', () => {
    const e = enc(datos(listo));
    assert.equal(e.titulo, 'Octubre está listo para cerrarse');
    assert.equal(e.puedeCerrar, true);
    const sinSept = enc(datos(listo, { cerrados: new Set() }));
    assert.equal(sinSept.puedeCerrar, false);
    assert.equal(sinSept.cierreTexto, 'Cierra primero agosto.');
  });

  it('«Cerrado»: who closed it, and «Pedir reabrir»', () => {
    const e = enc(cerrado(false));
    assert.equal(e.titulo, 'Octubre está cerrado');
    assert.match(e.subtitulo, /^Cerrado el 20 nov a las 18:05 por Eduardo\./);
    assert.deepEqual(e.chip, { texto: 'Cerrado', tono: 'cerrado' });
    assert.equal(e.reabrirHref, '/empresa/cierre?mes=2026-10&panel=reabrir');
  });

  it('«Reabrir pedido»: the other founder answers, the requester waits', () => {
    const otro = enc(cerrado(true), 'f2');
    assert.equal(otro.pedido?.quien, 'Eduardo');
    assert.equal(otro.pedido?.mio, false);
    assert.equal(otro.reabrirHref, null);
    assert.equal(enc(cerrado(true), 'f1').pedido?.mio, true);
  });

  it('the month in progress cannot close yet', () => {
    const e = enc(datos(listo, { mes: '2026-11' }));
    assert.equal(e.titulo, 'Noviembre todavía no termina');
    assert.equal(e.puedeCerrar, false);
  });
});

describe('the month on screen', () => {
  it('defaults to last month, and keeps a valid ?mes=', () => {
    assert.equal(parseMesCierre(undefined, '2026-11-21'), '2026-10');
    assert.equal(parseMesCierre(undefined, '2027-01-05'), '2026-12');
    assert.equal(parseMesCierre('2026-08', '2026-11-21'), '2026-08');
    assert.equal(parseMesCierre('2026-13', '2026-11-21'), '2026-10');
    assert.equal(hrefCierre('2026-10', 'aprobar'), '/empresa/cierre?mes=2026-10&panel=aprobar');
  });
});
