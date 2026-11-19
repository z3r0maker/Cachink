import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { declaracionDelForm, valoresDeclaracion } from '../src/server/empresa/impuestos-form';
import {
  enAgenda,
  mesesAnteriores,
  pagoDe,
  papelesDe,
} from '../src/server/empresa/impuestos-papeles';
import { mesDe, type DatosImpuestos } from '../src/server/empresa/impuestos-view';
import { datos, OCTUBRE, papel } from './impuestos-fixture';

/** Impuestos' papers, its payment, the earlier months and the drawer (E-13, CD-09, CD-09b). */
const mesDel = (d: DatosImpuestos) => {
  const m = mesDe(d, '2026-10');
  if (m === null) throw new Error('no October');
  return m;
};

const acuse = papel('acuse', 'acuse-octubre.pdf');
const linea = papel('linea_captura', 'linea.pdf');
const comprobante = papel('comprobante_pago', 'spei.pdf');

describe('papelesDe', () => {
  it('says what each paper is for before it arrives', () => {
    const p = papelesDe(mesDel(datos()), datos());
    assert.deepEqual(
      p.map((x) => [x.nombre, x.documentoId]),
      [
        ['Acuse de la declaración', null],
        ['Línea de captura', null],
        ['Comprobante de pago', null],
      ],
    );
  });

  it('shows the línea with its amount and expiry, and warns when it is not the total', () => {
    const d = datos({ declaracion: OCTUBRE, estado: 'presentada', papeles: [acuse, linea] });
    const [a, l] = papelesDe(mesDel(d), d);
    assert.equal(a?.detalle, 'acuse-octubre.pdf · 12 nov');
    assert.equal(l?.detalle, '$1,290.18 · vigente hasta el 17 nov');
    assert.equal(l?.aviso, null);
    const mal = datos({
      declaracion: { ...OCTUBRE, lineaImporte: 1_000_00n },
      estado: 'presentada',
      papeles: [linea],
    });
    assert.equal(papelesDe(mesDel(mal), mal)[1]?.aviso, 'No es la suma declarada ($1,290.18).');
  });
});

describe('pagoDe', () => {
  it('waits for the figures, then the acuse, then the comprobante', () => {
    assert.equal(
      pagoDe(mesDel(datos()), datos()).texto,
      'Primero captura lo que declaró el contador.',
    );
    const preparada = datos({ declaracion: OCTUBRE, estado: 'preparada' });
    assert.equal(pagoDe(mesDel(preparada), preparada).puede, false);
    const sinComprobante = datos({ declaracion: OCTUBRE, estado: 'presentada', papeles: [acuse] });
    const p = pagoDe(mesDel(sinComprobante), sinComprobante);
    assert.deepEqual([p.puede, p.texto], [false, 'Sube el comprobante para marcarla pagada.']);
  });

  it('allows it with the comprobante, saying what it will post', () => {
    const d = datos({ declaracion: OCTUBRE, estado: 'presentada', papeles: [acuse, comprobante] });
    const p = pagoDe(mesDel(d), d);
    assert.deepEqual(
      [p.puede, p.texto],
      [true, 'Al marcarla, se registra el pago de $1,290.18 en Movimientos.'],
    );
  });

  it('closes a month en ceros without a comprobante, and has nothing left once paid', () => {
    const ceros = { ...OCTUBRE, iva: 0n, retencionIsr: 0n, retencionIva: 0n, lineaImporte: null };
    const d = datos({ declaracion: ceros, estado: 'presentada', papeles: [acuse] });
    assert.equal(pagoDe(mesDel(d), d).puede, true);
    const pagada = datos({ declaracion: OCTUBRE, estado: 'pagada', pagado: true });
    const p = pagoDe(mesDel(pagada), pagada);
    assert.deepEqual([p.cerrado, p.pagado, p.puede], [true, true, false]);
    // Paid on 14 November: its movement is in November, not in the month it declared.
    assert.equal(p.hrefPago, '/empresa/movimientos?mes=2026-11&ver=impuestos');
  });
});

describe('the earlier months and the Agenda', () => {
  it('lists the year before the month on screen, newest first', () => {
    const [sep] = mesesAnteriores(datos());
    assert.equal(sep?.nombre, 'Septiembre');
    assert.equal(sep?.detalle, 'Declarado: ISR $0.00 · IVA $412.00 · Retenciones $0.00');
    assert.deepEqual(sep?.chip, { texto: 'Pagado', tono: 'ok' });
    assert.equal(sep?.href, '/empresa/impuestos?mes=2026-09');
  });

  it("names the month's «ISR e IVA» in the Agenda with its step", () => {
    const d = datos({ declaracion: OCTUBRE, estado: 'presentada' });
    assert.deepEqual(enAgenda(mesDel(d)), {
      href: '/empresa/agenda/impuestos_mensual/2026-10',
      texto: 'En Agenda: ISR e IVA de octubre · Presentada',
    });
  });
});

describe('the drawer', () => {
  const form = (o: Record<string, string>) => {
    const f = new FormData();
    for (const [k, v] of Object.entries({
      periodo: '2026-10',
      isr: '0',
      iva: '612.85',
      retencionIsr: '350',
      retencionIva: '373.33',
      ...o,
    }))
      f.set(k, v);
    return f;
  };

  it('reads the four figures and the línea, the línea optional', () => {
    const r = declaracionDelForm(form({ lineaImporte: '1,336.18', lineaVigencia: '2026-11-17' }));
    assert.ok(r.ok);
    assert.equal(r.v.iva, 612_85n);
    assert.equal(r.v.lineaImporte, 1_336_18n);
    const sin = declaracionDelForm(form({}));
    assert.ok(sin.ok && sin.v.lineaImporte === null && sin.v.lineaVigencia === null);
  });

  it('asks for a figure left blank, and for pesos it can read', () => {
    assert.deepEqual(declaracionDelForm(form({ iva: '' })), {
      ok: false,
      message: 'Escribe el IVA a pagar; si no hay, pon 0.',
    });
    assert.equal(declaracionDelForm(form({ isr: 'mil' })).ok, false);
  });

  it('prefills the captured figures beside their estimates', () => {
    const v = valoresDeclaracion(mesDel(datos({ declaracion: OCTUBRE })));
    assert.deepEqual(v.campos[1], {
      name: 'iva',
      label: 'IVA a pagar',
      valor: '566.85',
      estimado: '56685',
    });
    assert.equal(v.lineaImporte, '1290.18');
  });
});
