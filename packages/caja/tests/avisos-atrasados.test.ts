import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { avisosAtrasados, MAX_ATRASADOS } from '../src/avisos/atrasados';
import { avisosVivos } from '../src/avisos/vivo';
import { CUENTAS } from '../src/cobranza/cuentas';
import { estado } from '../src/cobranza/derive';
import type { AvisosPara } from '../src/lectura/cola-shapes';

const HOY = '2026-05-14';
const LUEGO = '2026-05-20';

describe('avisosAtrasados (M-09, MvAvisos «COBRANZA»)', () => {
  it('flags only the late accounts, as Fiado y abonos says them', () => {
    const tarde = CUENTAS.filter((c) => estado(c) === 'Atrasado').map((c) => c.id);
    const avisos = avisosAtrasados(CUENTAS, LUEGO);
    assert.deepEqual(
      avisos.map((a) => a.id.split(':')[1]),
      tarde,
    );
    const [chuy] = avisos;
    assert.equal(chuy?.grupo, 'caja');
    assert.equal(chuy?.tipo, 'Cobranza');
    assert.match(chuy?.titulo ?? '', /lleva 6 días sin abonar$/);
    assert.match(chuy?.cuerpo ?? '', /^Debe \$[\d,]+\.\d{2}\. Si pasa por aquí/);
    assert.deepEqual(chuy?.cta, { label: 'Ir a Fiado y abonos', href: '/operador/cobranza' });
    assert.equal(chuy?.leido, false);
  });

  it('says nothing about a late account that paid something today', () => {
    assert.deepEqual(avisosAtrasados(CUENTAS, HOY), []);
  });

  it('applies the device-local read marks by id', () => {
    const [a] = avisosAtrasados(CUENTAS, LUEGO);
    const [b] = avisosAtrasados(CUENTAS, LUEGO, [a?.id ?? '']);
    assert.equal(b?.leido, true);
  });

  it('lists a few at most', () => {
    const muchas = Array.from({ length: 6 }, (_, i) =>
      CUENTAS.filter((c) => estado(c) === 'Atrasado').map((c) => ({ ...c, id: `${c.id}-${i}` })),
    ).flat();
    assert.equal(avisosAtrasados(muchas, LUEGO).length, MAX_ATRASADOS);
  });
});

describe('avisosVivos: where the queue lives', () => {
  const vacio: AvisosPara = {
    mensajes: [],
    leidos: [],
    cola: { cuantos: 2, desde: null },
    rechazados: 0,
    stockBajo: [],
    dueno: null,
  };

  it('keeps the web caja’s «este navegador» by default', () => {
    assert.match(avisosVivos(vacio, HOY).avisos[0]?.cuerpo ?? '', /^Viven en este navegador/);
  });

  it('says «esta caja» on the phone', () => {
    assert.match(
      avisosVivos(vacio, HOY, 'esta caja').avisos[0]?.cuerpo ?? '',
      /^Viven en esta caja/,
    );
  });
});
