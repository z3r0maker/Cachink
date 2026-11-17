import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import { limitesDe, pct } from '../src/server/empresa/limites-view';

/** Límites' view (E-15, board CD-12d): the gauges, their sources, the tile and the signals. */
const T2026 = { anio: 2026, sas: 767_884_994n, resico: 3_500_000_000n };
const OCTUBRE = {
  hoy: '2026-10-31',
  topes: [T2026],
  proyectos: [{ projectId: 'xangarro', nombre: 'Xangarro', monto: 735_000n }],
  mesAnterior: 390_000n,
};

describe('pct', () => {
  it('writes whole points from 1 %, truncated, and one significant digit below', () => {
    assert.equal(pct(800_000), '80 %');
    assert.equal(pct(799_999), '79 %');
    assert.equal(pct(957), '0.1 %');
    assert.equal(pct(210), '0.02 %');
    assert.equal(pct(0), '0 %');
  });
});

describe('limitesDe', () => {
  const v = limitesDe(OCTUBRE);

  it("measures board CD-12d's October on both caps", () => {
    assert.equal(v.conTope, true);
    assert.equal(v.titulo, '2026, a octubre');
    const [sas, resico] = v.medidores;
    assert.equal(sas?.monto, '$7,350.00 de $7,678,849.94');
    assert.equal(sas?.pct, '0.1 %');
    assert.equal(sas?.proyTexto, 'A este ritmo, en diciembre: $15,150.00 (0.2 %)');
    assert.equal(sas?.alerta, null);
    assert.equal(resico?.pct, '0.02 %');
  });

  it('says where the figures come from, project by project', () => {
    assert.deepEqual(v.fuentes, [
      { que: 'Ingresos de enero a octubre, sin IVA, de todos los proyectos', cuanto: '$7,350.00' },
      { que: 'Xangarro', cuanto: '$7,350.00' },
      {
        que: 'Proyección: el ingreso de septiembre ($3,900.00) por cada mes que falta (2)',
        cuanto: '+$7,800.00',
      },
    ]);
  });

  it('sums two projects into one gauge', () => {
    const dos = limitesDe({
      ...OCTUBRE,
      proyectos: [...OCTUBRE.proyectos, { projectId: 'otro', nombre: 'Otro', monto: 265_000n }],
    });
    assert.equal(dos.medidores[0]?.monto, '$10,000.00 de $7,678,849.94');
  });

  it('gives the Resumen its tile, quiet under 80 %', () => {
    assert.deepEqual(v.tope, {
      valor: '0.1 %',
      cambio: '$7,350 de $7.68 M',
      ref: 'Proyección a diciembre: 0.2 %',
      aviso: false,
    });
    assert.deepEqual(v.senales, []);
  });

  it('warns at 80 %, says the projection passes, and signals it', () => {
    const alto = limitesDe({
      ...OCTUBRE,
      proyectos: [{ projectId: 'xangarro', nombre: 'Xangarro', monto: 614_308_000n }],
      // $1,000,000 a month for two more months: $8,143,080 by December, over the cap.
      mesAnterior: 100_000_000n,
    });
    const sas = alto.medidores[0];
    assert.equal(sas?.alerta?.titulo, 'Vas en 80 % del tope de la SAS');
    assert.match(sas?.alerta?.texto ?? '', /^A este ritmo lo pasas antes de fin de año\./);
    assert.match(sas?.alerta?.texto ?? '', /habla con el abogado antes del 95 %/);
    assert.equal(alto.tope.aviso, true);
    assert.deepEqual(
      alto.senales.map((s) => [s.titulo, s.tono]),
      [['Vas en 80 % del tope de la SAS', 'warn']],
    );
  });

  it("never measures a year against last year's caps", () => {
    const enero = limitesDe({ ...OCTUBRE, hoy: '2027-01-20', mesAnterior: 0n });
    assert.equal(enero.conTope, false);
    assert.deepEqual(enero.medidores, []);
    assert.equal(enero.tope.valor, 'Falta 2027');
    assert.equal(enero.tope.aviso, true);
    assert.deepEqual(enero.topes[0], { anio: '2027', sas: 'Falta', resico: 'Falta', falta: true });
    assert.equal(enero.anterior?.anio, 2026);
    assert.deepEqual(
      enero.senales.map((s) => s.titulo),
      ['Faltan los topes de 2027'],
    );
  });
});
