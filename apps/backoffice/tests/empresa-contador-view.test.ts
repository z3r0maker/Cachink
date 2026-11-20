import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { IngresoDelPeriodo } from '@xangarro/data-pg';
import {
  balanzaDelMes,
  CUENTAS_DEL_CATALOGO,
  estadoDeCodigos,
  type AccountKey,
} from '@xangarro/domain/corp';

import { vistaDeCodigos } from '../src/server/empresa/codigos-view';
import { emitidasDelPaquete } from '../src/server/empresa/contador-emitidas';
import { vistaDelPaquete, type DatosContador } from '../src/server/empresa/contador-view';

/** The contador's package and codes as boards CD-10d and CD-10e show them (E-43). */
const pago = (over: Partial<IngresoDelPeriodo>): IngresoDelPeriodo => ({
  paymentId: 'in_1',
  paidAt: '2026-10-03T03:00:00.000Z',
  totalCentavos: 1_160_00n,
  route: 'individual_pue',
  status: 'stamped',
  formaPago: '04',
  description: 'Plan Negocio',
  receptorRfc: 'AAA010101AAA',
  receptorNombre: 'Cliente Uno',
  invoiceUuid: 'UUID-1',
  complementUuid: null,
  globalUuid: null,
  notasDeCreditoCentavos: 0n,
  ...over,
});

const todos = () => new Map(CUENTAS_DEL_CATALOGO.map((c, i) => [c, `${100 + i}.01`] as const));

const sin = (...quitar: AccountKey[]) => {
  const m = todos();
  for (const q of quitar) m.delete(q);
  return m;
};

const lista = (codigos: ReadonlyMap<AccountKey, string>, id = 'l1') => ({
  id,
  codigos,
  capturadaPor: 'f1',
  capturadaAt: '2026-11-14T18:00:00.000Z',
});

function datos(over: Partial<DatosContador> = {}): DatosContador {
  const codigos =
    over.codigos ??
    estadoDeCodigos(
      [lista(todos())],
      [
        {
          id: 'v1',
          listaId: 'l1',
          validadaEl: '2026-11-14',
          marcadaPor: 'f2',
          marcadaAt: '2026-11-15T00:00:00.000Z',
        },
      ],
    );
  return {
    mes: '2026-10',
    cerrado: true,
    faltanPasos: 0,
    codigos,
    balanza: balanzaDelMes(
      [
        { cuenta: 'bancos', tramo: 'mes', debe: 1_160_00n, haber: 0n },
        { cuenta: 'ingresos', tramo: 'mes', debe: 0n, haber: 1_000_00n },
        { cuenta: 'iva_trasladado', tramo: 'mes', debe: 0n, haber: 160_00n },
      ],
      codigos.lista?.codigos ?? new Map(),
    ),
    emitidas: emitidasDelPaquete([pago({})]),
    recibidas: 12,
    noDeducibles: 1,
    sinFactura: 0,
    comprobantes: ['Acuse · ISR e IVA de octubre', 'Estado de cuenta de octubre 2026'],
    impuestosPendientes: false,
    ...over,
  };
}

describe('Paquete para el contador · emitidas', () => {
  it('lists each invoice, each complement and the global once, without the cancelled', () => {
    const e = emitidasDelPaquete([
      pago({}),
      pago({
        paymentId: 'in_2',
        invoiceUuid: 'UUID-2',
        complementUuid: 'UUID-2P',
        route: 'individual_ppd',
      }),
      pago({ paymentId: 'in_3', invoiceUuid: 'UUID-3', status: 'cancelled' }),
      pago({
        paymentId: 'in_4',
        route: 'global',
        status: 'in_global',
        invoiceUuid: null,
        receptorRfc: null,
        globalUuid: 'UUID-G',
        totalCentavos: 500_00n,
      }),
      pago({
        paymentId: 'in_5',
        route: 'global',
        status: 'in_global',
        invoiceUuid: null,
        receptorRfc: null,
        globalUuid: 'UUID-G',
        totalCentavos: 300_00n,
      }),
    ]);
    assert.deepEqual(
      e.cfdis.map((c) => [c.uuid, c.tipo, c.total]),
      [
        ['UUID-1', 'Factura', 1_160_00n],
        ['UUID-2', 'Factura', 1_160_00n],
        ['UUID-2P', 'Complemento de pago', 1_160_00n],
        ['UUID-G', 'Factura global', 800_00n],
      ],
    );
    assert.equal(e.cfdis[0]?.fecha, '2026-10-02');
    assert.equal(e.cfdis[3]?.rfc, 'XAXX010101000');
    assert.equal(e.nominativas, 2);
    assert.equal(e.global, 'timbrada');
  });

  it('a global still to stamp is named, and not listed', () => {
    const e = emitidasDelPaquete([
      pago({ route: 'global', status: 'pending_global', invoiceUuid: null, receptorRfc: null }),
    ]);
    assert.deepEqual(e.cfdis, []);
    assert.equal(e.global, 'por_timbrar');
  });
});

describe('Paquete para el contador · el panel', () => {
  it('a closed month is final, and says what goes in it', () => {
    const v = vistaDelPaquete(datos());
    assert.equal(v.chip, 'Final');
    assert.equal(v.aviso, null);
    assert.match(v.sub, /^Octubre está cerrado/);
    assert.deepEqual(
      v.partes.map((p) => [p.nombre, p.archivo, p.aviso]),
      [
        ['Balanza de comprobación', 'balanza-2026-10.csv', false],
        ['Facturas emitidas', 'emitidas.csv', false],
        ['Facturas recibidas', 'recibidas/', false],
        ['Acuses y comprobantes', 'acuses/', false],
      ],
    );
    assert.equal(
      v.partes[0]?.detalle,
      '22 cuentas con su código agrupador · saldo inicial, debe, haber y saldo final',
    );
    assert.equal(v.partes[1]?.detalle, '1 CFDI con su folio fiscal');
    assert.equal(
      v.partes[2]?.detalle,
      '12 XML · el gasto sin factura, marcado no deducible, va solo en la balanza',
    );
    assert.equal(
      v.partes[3]?.detalle,
      'Acuse · ISR e IVA de octubre · Estado de cuenta de octubre 2026',
    );
    assert.equal(v.boton, 'Descargar el paquete de octubre');
    assert.equal(v.zip, 'mexia-2026-10-final.zip');
    assert.equal(v.href, '/empresa/cierre/paquete?mes=2026-10');
  });

  it('shows every row of the balanza, formatted, and its totals', () => {
    const v = vistaDelPaquete(datos());
    assert.equal(v.filas.length, 22);
    assert.deepEqual(v.filas[0], {
      cuenta: 'bancos',
      codigo: '100.01',
      nombre: 'Bancos',
      inicial: '$0.00',
      debe: '$1,160.00',
      haber: '$0.00',
      final: '$1,160.00',
    });
    assert.deepEqual(v.total, {
      texto: '22 cuentas · cuadra',
      debe: '$1,160.00',
      haber: '$1,160.00',
    });
  });

  it('an open month is preliminar, and names what is still missing', () => {
    const v = vistaDelPaquete(
      datos({
        cerrado: false,
        faltanPasos: 2,
        impuestosPendientes: true,
        sinFactura: 1,
        emitidas: emitidasDelPaquete([
          pago({}),
          pago({ paymentId: 'g', route: 'global', status: 'pending_global', invoiceUuid: null }),
        ]),
      }),
    );
    assert.equal(v.chip, 'Preliminar');
    assert.match(v.sub, /^Octubre sigue abierto: faltan 2 pasos\./);
    assert.equal(
      v.partes[1]?.detalle,
      '1 CFDI con su folio fiscal · la factura global de octubre aún no se timbra',
    );
    assert.equal(v.partes[1]?.aviso, true);
    assert.match(v.partes[2]?.detalle ?? '', /1 gasto aún sin su factura/);
    assert.match(v.partes[3]?.detalle ?? '', /la declaración de ISR e IVA aún no se presenta$/);
    assert.equal(v.boton, 'Descargar el preliminar de octubre');
    assert.equal(v.zip, 'mexia-2026-10-preliminar.zip');
    assert.match(v.nota, /cada vez que lo descargas/);
  });

  it('warns of the accounts with no code, naming them, and links to the codes', () => {
    const codigos = estadoDeCodigos(
      [lista(sin('stripe_por_depositar', 'iva_por_acreditar', 'afac'))],
      [],
    );
    const v = vistaDelPaquete(datos({ codigos }));
    assert.equal(v.aviso?.titulo, '3 cuentas no tienen código agrupador');
    assert.equal(
      v.aviso?.texto,
      'La balanza sale con esas celdas vacías: Stripe por depositar, IVA pendiente de acreditar y Aportaciones para futuros aumentos de capital. Pídeselos al contador.',
    );
    assert.equal(v.partes[0]?.detalle, '22 cuentas · 19 con su código agrupador, 3 sin él');
    assert.equal(v.partes[0]?.aviso, true);
    assert.equal(v.filas.find((f) => f.cuenta === 'afac')?.codigo, null);
  });

  it('with no codes at all names a few and counts the rest', () => {
    const v = vistaDelPaquete(datos({ codigos: estadoDeCodigos([], []) }));
    assert.equal(v.aviso?.titulo, '22 cuentas no tienen código agrupador');
    assert.match(v.aviso?.texto ?? '', /Bancos, Stripe por depositar, IVA acreditable y 19 más\./);
    assert.equal(v.partes[0]?.detalle, '22 cuentas · ninguna con su código agrupador');
  });

  it('complete codes the contador has not validated yet still warn', () => {
    const v = vistaDelPaquete(datos({ codigos: estadoDeCodigos([lista(todos())], []) }));
    assert.equal(v.aviso?.titulo, 'Los códigos agrupadores aún no están validados');
  });
});

describe('Códigos agrupadores · la página', () => {
  const socios = new Map([['f1', 'Fundador 1']]);

  it('with no list: the three steps, nothing to validate yet', () => {
    const v = vistaDeCodigos(estadoDeCodigos([], []), socios, '2026-11-19');
    assert.equal(v.titulo, 'Aún no hay códigos agrupadores');
    assert.equal(v.chip.texto, 'Sin validar · 0 de 22');
    assert.equal(v.pasos, true);
    assert.equal(v.validar, null);
    assert.equal(v.noValidar, 'Se marca cuando las 22 cuentas tengan código.');
    assert.deepEqual(
      v.grupos.map((g) => [g.nombre, g.filas.length]),
      [
        ['Activo', 5],
        ['Pasivo', 6],
        ['Capital', 3],
        ['Ingresos', 1],
        ['Costos y gastos', 5],
        ['Otros', 2],
      ],
    );
    assert.equal(v.grupos[0]?.filas[0]?.falta, false);
  });

  it('while capturing: what is missing is marked, and validating waits', () => {
    const e = estadoDeCodigos(
      [lista(sin('stripe_por_depositar', 'iva_por_acreditar', 'afac'))],
      [],
    );
    const v = vistaDeCodigos(e, socios, '2026-11-19');
    assert.equal(v.titulo, '19 de 22 cuentas con su código');
    assert.equal(v.noValidar, 'Faltan 3 códigos para marcarla.');
    const stripe = v.grupos[0]?.filas.find((f) => f.cuenta === 'stripe_por_depositar');
    assert.deepEqual(stripe, {
      cuenta: 'stripe_por_depositar',
      nombre: 'Stripe por depositar',
      naturaleza: 'Deudora',
      codigo: '',
      falta: true,
    });
  });

  it('complete: may be marked as validated, from today back', () => {
    const v = vistaDeCodigos(estadoDeCodigos([lista(todos())], []), socios, '2026-11-19');
    assert.equal(v.titulo, 'Las 22 cuentas tienen su código');
    assert.deepEqual(v.validar, { listaId: 'l1', hoy: '2026-11-19' });
    assert.equal(v.noValidar, null);
    assert.equal(v.chip.texto, 'Sin validar · 22 de 22');
  });

  it('validated: says when, and who captured them', () => {
    const e = estadoDeCodigos(
      [lista(todos())],
      [
        {
          id: 'v1',
          listaId: 'l1',
          validadaEl: '2026-11-14',
          marcadaPor: 'f1',
          marcadaAt: '2026-11-15T00:00:00.000Z',
        },
      ],
    );
    const v = vistaDeCodigos(e, socios, '2026-11-19');
    assert.equal(v.titulo, 'Validados por el contador el 14 nov');
    assert.match(v.texto, /^Los 22 códigos los capturó Fundador 1 el 14 nov\./);
    assert.deepEqual(v.chip, { texto: 'Validados', tono: 'ok' });
    assert.equal(v.validar, null);
    assert.equal(v.noValidar, null);
    assert.equal(v.guardarTexto, 'Cambiar un código deja la lista sin validar.');
  });
});
