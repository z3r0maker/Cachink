import assert from 'node:assert/strict';
import { ServicioInvalidoError, type Servicio } from '@xangarro/domain/corp';
import { describe, it } from 'vitest';

import { ServicioDesconocidoError } from '../../src/corp/errors.js';
import {
  darDeBajaServicio,
  guardarServicio,
  type ServiceRepository,
} from '../../src/corp/servicios.js';
import { FakeLedger } from './fake-ledger.js';
import { FakePlantillas } from './fake-recurrentes.js';

/** E-24, boards CD-18c and CD-18d: a service and the recurring template it owns. */
class FakeServicios implements ServiceRepository {
  readonly guardados = new Map<string, Servicio>();
  fallar = false;
  async findById(id: string) {
    return this.guardados.get(id) ?? null;
  }
  async list() {
    return [...this.guardados.values()];
  }
  async save(s: Servicio) {
    if (this.fallar) throw new Error('corp is down');
    this.guardados.set(s.id, s);
  }
}

function deps() {
  return { servicios: new FakeServicios(), plantillas: new FakePlantillas(new FakeLedger()) };
}

const vercel: Servicio = {
  id: 'srv-vercel',
  nombre: ' Vercel ',
  para: 'Portal y landing',
  categoria: 'costo_servicio',
  cobro: 'fijo',
  estado: 'activo',
  moneda: 'USD',
  monto: 20_00n,
  diaCargo: 28,
  renueva: null,
  tarifa: null,
  aviso: null,
  limite: null,
  usoPlan: null,
  unidad: null,
  gastoMes: null,
  gastoAl: null,
  pagaCon: 'Tarjeta •••• 4821',
  plantillaId: null,
};

const guardar = (d: ReturnType<typeof deps>, servicio: Servicio, recurrente = true) =>
  guardarServicio(d, {
    servicio,
    recurrente,
    plantillaNuevaId: 'rec-1',
    hoy: '2026-10-08',
    founderId: 'f1',
  });

describe('guardarServicio', () => {
  it('saves a new fixed service with its template, charging from this month', async () => {
    const d = deps();
    const s = await guardar(d, vercel);
    assert.equal(s.plantillaId, 'rec-1');
    assert.equal(d.servicios.guardados.get('srv-vercel')?.nombre, 'Vercel');
    const [p] = d.plantillas.plantillas;
    assert.deepEqual(
      [p?.id, p?.moneda, p?.montoEstimado, p?.diaCargo, p?.desde, p?.periodicidad, p?.activo],
      ['rec-1', 'USD', 20_00n, 28, '2026-10', 'mensual', true],
    );
  });

  it('carries an edit to its template and keeps the month it began', async () => {
    const d = deps();
    await guardar(d, vercel);
    await guardarServicio(d, {
      servicio: { ...vercel, monto: 25_00n, diaCargo: 2 },
      recurrente: true,
      plantillaNuevaId: 'rec-2',
      hoy: '2026-12-01',
      founderId: 'f2',
    });
    assert.equal(d.plantillas.plantillas.length, 1);
    const [p] = d.plantillas.plantillas;
    assert.deepEqual([p?.montoEstimado, p?.diaCargo, p?.desde], [25_00n, 2, '2026-10']);
  });

  it('adopts the template a capture made, under its own id', async () => {
    const d = deps();
    await d.plantillas.ensure({
      id: 'rec-contador',
      nombre: 'Contador',
      contraparte: 'Despacho Ruiz',
      rfc: null,
      categoria: 'administracion',
      moneda: 'MXN',
      montoEstimado: 3_500_00n,
      diaCargo: 12,
      projectId: null,
      deducible: true,
      desde: '2026-05',
      createdBy: 'f1',
    });
    const s = await guardar(d, {
      ...vercel,
      id: 'rec-contador',
      nombre: 'Contador',
      moneda: 'MXN',
      monto: 3_800_00n,
      diaCargo: 12,
    });
    assert.equal(s.plantillaId, 'rec-contador');
    const [p] = d.plantillas.plantillas;
    assert.deepEqual(
      [d.plantillas.plantillas.length, p?.montoEstimado, p?.contraparte],
      [1, 3_800_00n, 'Despacho Ruiz'],
    );
  });

  it('stops the template of one that no longer charges on a day, and keeps the link', async () => {
    const d = deps();
    await guardar(d, vercel);
    const s = await guardar(d, {
      ...vercel,
      cobro: 'gratis',
      monto: null,
      diaCargo: null,
      limite: 100,
    });
    assert.equal(s.plantillaId, 'rec-1');
    assert.equal(d.plantillas.plantillas[0]?.activo, false);
  });

  it('makes no template when its box is unchecked, nor for a free plan', async () => {
    const d = deps();
    await guardar(d, vercel, false);
    await guardar(d, {
      ...vercel,
      id: 'srv-supabase',
      cobro: 'gratis',
      monto: null,
      diaCargo: null,
      limite: 500,
    });
    assert.equal(d.plantillas.plantillas.length, 0);
  });

  it('refuses an invalid service and writes nothing', async () => {
    const d = deps();
    await assert.rejects(guardar(d, { ...vercel, monto: null }), ServicioInvalidoError);
    assert.equal(d.servicios.guardados.size, 0);
    assert.equal(d.plantillas.plantillas.length, 0);
  });

  it('surfaces a failed write, and the retry lands on the same template', async () => {
    const d = deps();
    d.servicios.fallar = true;
    await assert.rejects(guardar(d, vercel), /corp is down/);
    d.servicios.fallar = false;
    await guardar(d, vercel);
    assert.equal(d.plantillas.plantillas.length, 1);
  });
});

describe('darDeBajaServicio', () => {
  it('drops the service and stops its template', async () => {
    const d = deps();
    await guardar(d, vercel);
    const s = await darDeBajaServicio(d, 'srv-vercel', 'f2');
    assert.equal(s.estado, 'baja');
    assert.equal(d.servicios.guardados.get('srv-vercel')?.estado, 'baja');
    assert.equal(d.plantillas.plantillas[0]?.activo, false);
  });

  it('refuses a service that does not exist', async () => {
    await assert.rejects(darDeBajaServicio(deps(), 'nadie', 'f1'), ServicioDesconocidoError);
  });

  it('surfaces a failed write', async () => {
    const d = deps();
    await guardar(d, vercel);
    d.servicios.fallar = true;
    await assert.rejects(darDeBajaServicio(d, 'srv-vercel', 'f1'), /corp is down/);
  });
});
