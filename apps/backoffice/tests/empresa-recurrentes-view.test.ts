import assert from 'node:assert/strict';
import { describe, it } from 'vitest';
import type { PlantillaRecurrente, RecurrenteDelMes } from '@xangarro/domain/corp';

import {
  coincide,
  filasDelMes,
  filaRecurrente,
  filaSugerida,
  montoEstimado,
  parseCategoria,
} from '../src/server/empresa/recurrentes-view';

/** E-02's recurring expenses on Movimientos, in the boards' words. */
const vercel: PlantillaRecurrente = {
  id: 'rec-1',
  nombre: 'Vercel',
  contraparte: 'Vercel Inc.',
  categoria: 'costo_servicio',
  moneda: 'USD',
  montoEstimado: 20_00n,
  diaCargo: 28,
  projectId: 'xangarro',
  deducible: true,
  activo: true,
  desde: '2026-09',
};

const del = (
  estado: RecurrenteDelMes['estado'],
  entryId: string | null = null,
): RecurrenteDelMes => ({
  plantilla: vercel,
  fecha: '2026-10-28',
  estado,
  entryId,
});

describe('montoEstimado', () => {
  it('keeps a template in its own currency', () => {
    assert.equal(montoEstimado(vercel), 'USD 20.00');
    assert.equal(montoEstimado({ moneda: 'MXN', montoEstimado: 3_500_00n }), '$3,500.00');
  });
});

describe('filaSugerida', () => {
  it('is an expense row that opens Registrar with the template and month', () => {
    const f = filaSugerida(del('sugerido'), '2026-10');
    assert.equal(f.estado, 'Sugerido');
    assert.equal(f.monto, '−USD 20.00');
    assert.equal(f.categoria, 'Costo del servicio');
    assert.equal(f.detalle, 'Vercel Inc. · recurrente');
    assert.equal(f.href, '/empresa/movimientos/registrar?plantilla=rec-1&mes=2026-10');
    assert.equal(f.filtro, 'gastos');
  });
});

describe('filaRecurrente', () => {
  it('links a registered month to its entry', () => {
    const f = filaRecurrente(del('registrado', 'E1'), '2026-10');
    assert.equal(f.estado, 'Registrado');
    assert.equal(f.href, '/empresa/movimientos/E1');
  });

  it('links a suggestion to Registrar and leaves a coming one without an action', () => {
    assert.match(
      filaRecurrente(del('sugerido'), '2026-10').href ?? '',
      /registrar\?plantilla=rec-1/,
    );
    const proximo = filaRecurrente(del('proximo'), '2026-10');
    assert.equal(proximo.estado, 'Próximo');
    assert.equal(proximo.href, null);
  });

  it('says when a template no longer repeats', () => {
    const f = filaRecurrente(
      { ...del('registrado', 'E1'), plantilla: { ...vercel, activo: false } },
      '2026-10',
    );
    assert.equal(f.detalle, 'Vercel Inc. · ya no se repite');
  });
});

describe('the category and search params', () => {
  it('reads a category, and anything else as every category', () => {
    assert.equal(parseCategoria('desarrollo'), 'desarrollo');
    assert.equal(parseCategoria('bancos'), null);
    assert.equal(parseCategoria(undefined), null);
  });

  it('mixes suggestions into the month newest first, and narrows by type, category and search', () => {
    const entrada = {
      ...filaSugerida(del('sugerido'), '2026-10'),
      id: 'e1',
      fechaIso: '2026-10-03',
      estado: 'Registrado' as const,
      concepto: 'Contador',
      detalle: '',
      categoriaKey: 'administracion' as const,
    };
    const socio = {
      ...entrada,
      id: 'e2',
      fechaIso: '2026-10-30',
      filtro: 'socios' as const,
      categoriaKey: null,
    };
    const recs = [del('sugerido'), { ...del('proximo'), plantilla: { ...vercel, id: 'rec-2' } }];
    const todas = filasDelMes([socio, entrada], recs, '2026-10', {
      ver: 'todos',
      cat: null,
      q: '',
    });
    assert.deepEqual(
      todas.map((x) => x.id),
      ['e2', 'sugerido-rec-1', 'e1'],
    );
    const gastos = filasDelMes([socio, entrada], recs, '2026-10', {
      ver: 'gastos',
      cat: null,
      q: '',
    });
    assert.deepEqual(
      gastos.map((x) => x.id),
      ['sugerido-rec-1', 'e1'],
    );
    const admin = filasDelMes([socio, entrada], recs, '2026-10', {
      ver: 'todos',
      cat: 'administracion',
      q: '',
    });
    assert.deepEqual(
      admin.map((x) => x.id),
      ['e1'],
    );
    const buscado = filasDelMes([socio, entrada], recs, '2026-10', {
      ver: 'todos',
      cat: null,
      q: 'vercel inc',
    });
    assert.deepEqual(
      buscado.map((x) => x.id),
      ['sugerido-rec-1'],
    );
  });

  it('finds by concepto or proveedor, ignoring case and accents', () => {
    const f = { concepto: 'Asesoría fiscal', detalle: 'Contadora López' };
    assert.equal(coincide(f, 'asesoria'), true);
    assert.equal(coincide(f, 'LOPEZ'), true);
    assert.equal(coincide(f, 'vercel'), false);
    assert.equal(coincide(f, '  '), true);
  });
});
