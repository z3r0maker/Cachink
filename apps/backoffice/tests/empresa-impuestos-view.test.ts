import assert from 'node:assert/strict';
import { describe, it } from 'vitest';

import {
  avisoDiferencia,
  chipDelMes,
  heroDe,
  pasosDe,
} from '../src/server/empresa/impuestos-encabezado';
import { tarjetasDe } from '../src/server/empresa/impuestos-tarjetas';
import {
  mesDe,
  parseMesImpuestos,
  sinMovimientos,
  type DatosImpuestos,
} from '../src/server/empresa/impuestos-view';
import { datos, OCTUBRE, papel } from './impuestos-fixture';

/** Impuestos' month, worded (E-13, board CD-09): its states, header, steps and cards. */
const mesDel = (d: DatosImpuestos) => {
  const m = mesDe(d, '2026-10');
  if (m === null) throw new Error('no October');
  return m;
};

describe('parseMesImpuestos', () => {
  it('opens on the month being declared, last month', () => {
    assert.equal(parseMesImpuestos(undefined, '2026-11-10'), '2026-10');
    assert.equal(parseMesImpuestos(undefined, '2027-01-05'), '2026-12');
  });

  it('keeps a named month up to this one, and ignores the future or a typo', () => {
    assert.equal(parseMesImpuestos('2026-08', '2026-11-10'), '2026-08');
    assert.equal(parseMesImpuestos('2026-11', '2026-11-10'), '2026-11');
    assert.equal(parseMesImpuestos('2026-12', '2026-11-10'), '2026-10');
    assert.equal(parseMesImpuestos('2026-13', '2026-11-10'), '2026-10');
  });
});

describe('the month on screen', () => {
  it('waits for the contador, with the estimate and the days left', () => {
    const d = datos();
    const m = mesDel(d);
    assert.equal(m.estado, 'por_declarar');
    assert.equal(m.vence, '2026-11-17');
    assert.deepEqual(chipDelMes(m, d.hoy), {
      texto: 'Vence el 17 nov · faltan 7 días',
      tono: 'off',
    });
    const h = heroDe(m, d);
    assert.equal(h.etiqueta, 'Estimado a pagar el 17 nov');
    assert.equal(h.total, '$1,290.18');
    assert.equal(h.texto, 'ISR $0.00 · IVA $566.85 · Retenciones $723.33');
    assert.deepEqual(
      pasosDe(m, d).map((p) => p.hecho),
      [true, false, false, false],
    );
  });

  it('says it is late once the 17th has passed', () => {
    const d = { ...datos(), hoy: '2026-11-20' };
    assert.deepEqual(chipDelMes(mesDel(d), d.hoy), { texto: 'Venció el 17 nov', tono: 'bad' });
  });

  it('flags the IVA the contador declared $46.00 above the estimate', () => {
    const d = datos({ declaracion: { ...OCTUBRE, iva: 612_85n }, estado: 'preparada' });
    const m = mesDel(d);
    assert.equal(m.estado, 'diferencia');
    assert.equal(chipDelMes(m, d.hoy).texto, 'Revisa con el contador');
    assert.equal(heroDe(m, d).total, '$1,336.18');
    assert.equal(heroDe(m, d).texto, 'Lo que declaró el contador. El estimado es $1,290.18.');
    const aviso = avisoDiferencia(m);
    assert.equal(aviso?.titulo, 'Revisa con el contador: el IVA no coincide por $46.00');
    assert.match(aviso?.texto ?? '', /En el IVA declaró \$612\.85 y aquí sale \$566\.85\./);
  });

  it('is presentada with its acuse, and pagada after the payment', () => {
    const acuse = papel('acuse', 'acuse-octubre.pdf');
    const presentada = datos({ declaracion: OCTUBRE, estado: 'presentada', papeles: [acuse] });
    const m = mesDel(presentada);
    assert.equal(m.estado, 'presentada');
    assert.equal(avisoDiferencia(m), null);
    assert.equal(pasosDe(m, presentada)[2]?.sub, 'Presentada el 12 nov');
    const pagada = datos({ declaracion: OCTUBRE, estado: 'pagada', pagado: true });
    assert.equal(heroDe(mesDel(pagada), pagada).etiqueta, 'Pagado el 14 nov');
    assert.deepEqual(chipDelMes(mesDel(pagada), pagada.hoy), { texto: 'Pagado', tono: 'ok' });
  });

  it('is empty with nothing collected, paid or declared', () => {
    const vacio = datos({
      meses: [
        datos().meses[0]!,
        {
          ...datos().meses[1]!,
          ingresos: 0n,
          deducciones: 0n,
          ivaTrasladado: 0n,
          ivaAcreditable: 0n,
          retencionIsr: 0n,
          retencionIva: 0n,
        },
      ],
    });
    assert.equal(sinMovimientos(vacio, mesDel(vacio)), true);
    assert.equal(sinMovimientos(datos(), mesDel(datos())), false);
  });
});

describe('tarjetasDe', () => {
  it('works the ISR on the year at a loss, the IVA, and the withholdings', () => {
    const t = tarjetasDe(mesDel(datos()));
    assert.deepEqual(
      t.map((x) => [x.id, x.resultado]),
      [
        ['isr', '$0.00'],
        ['iva', '$566.85'],
        ['retenciones', '$723.33'],
      ],
    );
    assert.equal(t[0]?.nota, 'Con pérdida en el año el pago es $0.00, pero se declara.');
    assert.equal(t[0]?.lineas[2]?.negativo, true);
    assert.equal(t[1]?.contador, '—');
  });

  it('compares each with the contador once declared', () => {
    const t = tarjetasDe(mesDel(datos({ declaracion: { ...OCTUBRE, iva: 612_85n } })));
    assert.deepEqual([t[1]?.diferencia, t[1]?.difTono], ['+$46.00', 'warn']);
    assert.deepEqual([t[2]?.diferencia, t[2]?.difTono], ['✓ $0.00', 'ok']);
  });

  it('shows the IVA a favor, and no Retenciones card in a month without any', () => {
    const [sep] = datos().meses;
    const d = datos({
      meses: [sep!, { ...sep!, mes: '2026-10', ivaTrasladado: 100_00n, ivaAcreditable: 900_00n }],
    });
    const t = tarjetasDe(mesDel(d));
    assert.deepEqual(
      t.map((x) => x.id),
      ['isr', 'iva'],
    );
    assert.deepEqual([t[1]?.resultadoLabel, t[1]?.resultado], ['A favor', '$800.00']);
  });
});
