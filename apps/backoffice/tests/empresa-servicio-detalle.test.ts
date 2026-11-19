import assert from 'node:assert/strict';
import type { PlantillaRecurrente } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import {
  gastosDe,
  graficaDelServicio,
  kpisDe,
  notaGrafica,
} from '../src/server/empresa/servicio-detalle-view';
import { servicioDelForm } from '../src/server/empresa/servicio-form';
import { panelRecurrente } from '../src/server/empresa/servicio-recurrente-view';
import { valoresDe } from '../src/server/empresa/servicio-valores';
import { AZURE, DATOS, SUPABASE, VERCEL } from './servicios-fixture';

/** A service's page and its drawer (E-24, boards CD-18c and CD-18d), on 8 October 2026. */
describe('kpisDe', () => {
  it("explains Azure's average and projects October from 8 days", () => {
    const [prom, mes, aviso] = kpisDe(AZURE, DATOS);
    assert.deepEqual(
      [prom?.valor, prom?.nota],
      ['$873.33', 'Julio a septiembre: $480.00 + $900.00 + $1,240.00, entre 3'],
    );
    assert.deepEqual(
      [mes?.label, mes?.valor, mes?.nota, mes?.aviso],
      ['Octubre, proyección', '$1,710.00', 'Van $441.29 en 8 días', false],
    );
    assert.equal(aviso?.valor, '$2,500.00');
  });

  it('says by how much the projection passes the alert', () => {
    const [, mes] = kpisDe({ ...AZURE, gastoMes: 733_00n }, DATOS);
    assert.deepEqual(
      [mes?.valor, mes?.nota, mes?.aviso],
      ['$2,840.38', 'Van $733.00 en 8 días: pasa del aviso por $340.38', true],
    );
  });

  it('shows the month so far without a projection under 3 days', () => {
    const corto = { ...AZURE, gastoMes: 96_40n, gastoAl: '2026-10-02' };
    const [, mes] = kpisDe(corto, { ...DATOS, hoy: '2026-10-02' });
    assert.deepEqual(
      [mes?.label, mes?.valor, mes?.nota],
      ['Octubre hasta hoy', '$96.40', 'Sin proyección: hay 2 días de uso'],
    );
    assert.match(notaGrafica(corto, '2026-10-02'), /desde el día 3/);
  });

  it('reads a free plan as its share of the limit, with no chart', () => {
    const [, uso] = kpisDe(SUPABASE, DATOS);
    assert.deepEqual([uso?.valor, uso?.nota, uso?.aviso], ['62 %', '310 de 500 MB', true]);
    assert.equal(graficaDelServicio(SUPABASE, DATOS), null);
  });
});

describe('gastosDe and the chart', () => {
  it("lists Azure's charges newest first, each with the month it paid", () => {
    const [ultimo] = gastosDe(AZURE, DATOS);
    assert.deepEqual(ultimo, {
      href: '/empresa/movimientos/e-rec-azure-2026-09',
      fecha: '3 oct',
      concepto: 'Azure AI Foundry · septiembre',
      monto: '$1,240.00',
    });
  });

  it('puts the alert line on the same scale as the bars', () => {
    const g = graficaDelServicio(AZURE, DATOS);
    assert.equal(g?.aviso, 100);
    assert.equal(g?.barras[4]?.alto, 49.6);
  });
});

describe('panelRecurrente', () => {
  const plantilla: PlantillaRecurrente = {
    id: 'rec-azure',
    nombre: 'Azure AI Foundry',
    contraparte: null,
    rfc: null,
    categoria: 'costo_servicio',
    moneda: 'MXN',
    montoEstimado: 0n,
    diaCargo: 3,
    projectId: null,
    deducible: true,
    activo: true,
    desde: '2026-06',
  };

  it('says a usage template charges each 3rd with no fixed amount', () => {
    assert.deepEqual(panelRecurrente(AZURE, plantilla, '2026-10-08'), {
      titulo: 'Cada día 3, sin monto fijo',
      texto: 'Costo del servicio · Tarjeta •••• 4821 · el monto se pone al ver el cargo',
      proximo: 'Próximo: 3 nov',
      activa: true,
    });
  });

  it('says why a free plan has none, and that a stopped one no longer repeats', () => {
    assert.equal(panelRecurrente(SUPABASE, null, '2026-10-08').titulo, 'Sin gasto recurrente');
    assert.equal(
      panelRecurrente(AZURE, { ...plantilla, activo: false }, '2026-10-08').titulo,
      'Ya no se repite',
    );
  });
});

const form = (campos: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    id: 'srv-1',
    plantillaNuevaId: 'rec-1',
    nombre: 'Vercel',
    categoria: 'costo_servicio',
    ...campos,
  }))
    f.set(k, v);
  return f;
};

describe('servicioDelForm', () => {
  it('reads a fixed service in dollars with its day, and its recurring box', () => {
    const c = servicioDelForm(
      form({
        cobro: 'fijo',
        moneda: 'USD',
        monto: '20',
        dia: '28',
        pagaCon: 'Tarjeta •••• 4821',
        recurrente: 'si',
      }),
      '2026-10-08',
    );
    assert.ok(c.ok);
    assert.deepEqual(
      [c.v.servicio.moneda, c.v.servicio.monto, c.v.servicio.diaCargo, c.v.recurrente],
      ['USD', 20_00n, 28, true],
    );
  });

  it("keeps a month's reading on its day when its amount did not change", () => {
    const campos = {
      cobro: 'uso',
      dia: '3',
      gastoMes: '441.29',
      gastoMesPrevio: '441.29',
      gastoAlPrevio: '2026-10-08',
    };
    const igual = servicioDelForm(form(campos), '2026-10-12');
    assert.ok(igual.ok);
    assert.equal(igual.v.servicio.gastoAl, '2026-10-08');
    const nuevo = servicioDelForm(form({ ...campos, gastoMes: '600' }), '2026-10-12');
    assert.ok(nuevo.ok);
    assert.equal(nuevo.v.servicio.gastoAl, '2026-10-12');
  });

  it('refuses an amount that is not pesos, a way of charging it does not know, and a missing id', () => {
    assert.deepEqual(servicioDelForm(form({ cobro: 'fijo', monto: 'veinte' }), '2026-10-08'), {
      ok: false,
      message: 'Escribe cuánto en pesos, como 1250.50.',
    });
    assert.equal(servicioDelForm(form({ cobro: 'trueque' }), '2026-10-08').ok, false);
    assert.equal(servicioDelForm(form({ cobro: 'fijo', id: '' }), '2026-10-08').ok, false);
  });

  it('round-trips a stored service through the drawer', () => {
    const v = valoresDe(VERCEL);
    const c = servicioDelForm(form({ ...v, id: v.id, porContratar: '' }), '2026-10-08');
    assert.ok(c.ok);
    assert.deepEqual({ ...c.v.servicio, plantillaId: VERCEL.plantillaId }, VERCEL);
  });
});
