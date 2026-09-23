import { describe, it } from 'vitest';
import assert from 'node:assert/strict';

import { DEFAULT_HEALTH_THRESHOLDS, type FlujoDeEfectivo } from '@xangarro/domain';

import {
  ARCO_LARGO,
  DER_MAX,
  EJE,
  IZQ_MIN,
  bandasDeGauge,
  escalaDeFlujo,
  filasDeFlujo,
  puntaDeAguja,
} from '../src/app/(portal)/estados/chart-geo';

const p = (n: number) => BigInt(n) * 100n;

const flujo = (over: Partial<FlujoDeEfectivo> = {}): FlujoDeEfectivo => ({
  operacion: 0n,
  inversion: 0n,
  total: 0n,
  cobroVentasContado: p(96_200),
  cobroCreditoClientes: p(12_400),
  egresoOperativo: p(32_640),
  egresoInversion: p(18_900),
  ...over,
});

/** A bar's drawn length in px, the way the chart computes it. */
const largo = (monto: bigint, s: number) => Number(monto) * s;

describe('escalaDeFlujo — one scale for both sides', () => {
  it('never draws a salida longer than a larger entrada', () => {
    // The whole point: two scales would make the $32,640 gasto out-run the
    // $96,200 cobro, and the chart would say the opposite of the truth.
    const f = flujo();
    const s = escalaDeFlujo(filasDeFlujo(f));
    assert.ok(
      largo(f.egresoOperativo, s) < largo(f.cobroVentasContado, s),
      'the smaller amount must draw shorter, whichever side it is on',
    );
  });

  it('keeps every bar inside its own runway', () => {
    const f = flujo();
    const s = escalaDeFlujo(filasDeFlujo(f));
    for (const fila of filasDeFlujo(f)) {
      const px = largo(fila.monto, s);
      const limite = fila.entrada ? DER_MAX - EJE : EJE - IZQ_MIN;
      assert.ok(px <= limite + 0.01, `${fila.label} ran past its side (${px} > ${limite})`);
    }
  });

  it('a period with only entradas still scales, and only salidas too', () => {
    const soloEntradas = escalaDeFlujo(
      filasDeFlujo(flujo({ egresoOperativo: 0n, egresoInversion: 0n })),
    );
    assert.ok(soloEntradas > 0 && Number.isFinite(soloEntradas));
    const soloSalidas = escalaDeFlujo(
      filasDeFlujo(flujo({ cobroVentasContado: 0n, cobroCreditoClientes: 0n })),
    );
    assert.ok(soloSalidas > 0 && Number.isFinite(soloSalidas));
  });

  it('an empty period scales to zero rather than to Infinity', () => {
    // Every amount zero: `min(Infinity, Infinity)` must not reach the canvas.
    const vacio = escalaDeFlujo(
      filasDeFlujo(
        flujo({
          cobroVentasContado: 0n,
          cobroCreditoClientes: 0n,
          egresoOperativo: 0n,
          egresoInversion: 0n,
        }),
      ),
    );
    assert.equal(vacio, 0);
  });
});

describe('bandasDeGauge — the dial agrees with the verdict', () => {
  const t = DEFAULT_HEALTH_THRESHOLDS.margenBruto;

  it('the three bands tile the arc exactly once', () => {
    const [critico, aviso, sano] = bandasDeGauge(t.warning, t.healthy, 0.5);
    // Each pattern is `[gap] run 400`; the runs must sum to the whole arc.
    const corrida = (dash: string) => {
      const n = dash.split(' ').map(Number);
      return n.length === 2 ? (n[0] as number) : (n[2] as number);
    };
    const suma =
      corrida(critico?.dash ?? '') + corrida(aviso?.dash ?? '') + corrida(sano?.dash ?? '');
    assert.ok(Math.abs(suma - ARCO_LARGO) < 0.2, `bands summed to ${suma}, not ${ARCO_LARGO}`);
  });

  it('each band starts where the one before it ended', () => {
    const [critico, aviso, sano] = bandasDeGauge(t.warning, t.healthy, 0.5);
    const fin = (dash: string) => {
      const n = dash.split(' ').map(Number);
      return n.length === 2 ? (n[0] as number) : (n[1] as number) + (n[2] as number);
    };
    const inicio = (dash: string) => {
      const n = dash.split(' ').map(Number);
      return n.length === 2 ? 0 : (n[1] as number);
    };
    assert.equal(inicio(aviso?.dash ?? ''), fin(critico?.dash ?? ''));
    assert.equal(inicio(sano?.dash ?? ''), fin(aviso?.dash ?? ''));
  });

  it('a metric whose bands fill the dial leaves no green', () => {
    // hi === max: the healthy band has nowhere to go, and must be zero long
    // rather than negative, which would draw the dash backwards.
    const [, , sano] = bandasDeGauge(0.1, 0.5, 0.5);
    const n = (sano?.dash ?? '').split(' ').map(Number);
    assert.ok((n[2] as number) >= 0, 'the healthy band must never be negative');
  });
});

describe('puntaDeAguja', () => {
  it('points hard left at zero and hard right at the ceiling', () => {
    const izq = puntaDeAguja(0);
    const der = puntaDeAguja(1);
    assert.ok(izq.x < 30, `expected the left end, got x=${izq.x}`);
    assert.ok(der.x > 150, `expected the right end, got x=${der.x}`);
    // Both sit on the dial's baseline, so their y must match.
    assert.ok(Math.abs(izq.y - der.y) < 0.01);
  });

  it('points straight up at half', () => {
    const arriba = puntaDeAguja(0.5);
    assert.ok(Math.abs(arriba.x - 90) < 0.01, `expected x=90, got ${arriba.x}`);
    assert.ok(arriba.y < 30, 'and the tip above the hub');
  });

  it('clamps beyond the ceiling instead of swinging past it', () => {
    // A 90% margin on a 50% dial must rest on the right stop, not wrap round.
    assert.deepEqual(puntaDeAguja(1.8), puntaDeAguja(1));
    assert.deepEqual(puntaDeAguja(-0.4), puntaDeAguja(0));
  });
});
