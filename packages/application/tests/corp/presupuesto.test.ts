import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'vitest';
import {
  PresupuestoError,
  type Montos,
  type Presupuesto,
  type SolicitudGasto,
} from '@xangarro/domain/corp';

import {
  pedirGasto,
  prepararPresupuesto,
  responderPresupuesto,
  responderSolicitud,
  type NuevaSolicitud,
  type PresupuestoDeps,
  type PresupuestoRepository,
} from '../../src/corp/index.js';

/** E-22: the quarter's budget, its approval, and spending outside it (boards CD-15d, CD-15e). */
class FakePresupuesto implements PresupuestoRepository {
  readonly lista: Presupuesto[] = [];
  readonly pedidas: SolicitudGasto[] = [];
  async presupuestos() {
    return [...this.lista];
  }
  async preparar(p: { trimestre: string; montos: Montos; founderId: string }) {
    const id = `p${this.lista.length + 1}`;
    this.lista.push({
      id,
      trimestre: p.trimestre,
      montos: p.montos,
      preparadoPor: p.founderId,
      preparadoAt: new Date(Date.UTC(2026, 10, 18, this.lista.length)).toISOString(),
      respuesta: null,
    });
    return id;
  }
  async responder(id: string, kind: 'aprobado' | 'rechazado', founderId: string) {
    const i = this.lista.findIndex((p) => p.id === id);
    const p = this.lista[i];
    if (p === undefined) throw new Error('unknown');
    this.lista[i] = { ...p, respuesta: { kind, founderId, at: '2026-11-19T18:00:00.000Z' } };
  }
  async solicitudes() {
    return [...this.pedidas];
  }
  async pedir(s: NuevaSolicitud, decidir: (delMes: readonly SolicitudGasto[]) => boolean) {
    const delMes = this.pedidas.filter(
      (x) => x.periodo === s.periodo && x.founderId === s.founderId,
    );
    const nueva: SolicitudGasto = {
      ...s,
      id: `s${this.pedidas.length + 1}`,
      automatica: decidir(delMes),
      at: '2026-11-19T18:00:00.000Z',
      respuesta: null,
    };
    this.pedidas.push(nueva);
    return nueva;
  }
  async responderSolicitud(
    id: string,
    r: { kind: 'aprobada' | 'rechazada'; monto: bigint | null; founderId: string },
  ) {
    const i = this.pedidas.findIndex((s) => s.id === id);
    const s = this.pedidas[i];
    if (s === undefined) throw new Error('unknown');
    this.pedidas[i] = { ...s, respuesta: { ...r, at: '2026-11-19T19:00:00.000Z' } };
  }
}

const montos: Montos = {
  costo_servicio: 9_000_00n,
  ventas_marketing: 13_000_00n,
  desarrollo: 5_500_00n,
  administracion: 5_500_00n,
};

let repo: FakePresupuesto;
let deps: PresupuestoDeps;
const hoy = '2026-11-19';

beforeEach(() => {
  repo = new FakePresupuesto();
  deps = { presupuesto: repo, ingresoPromedio: async () => 15_600_00n };
});

const falla = async (p: Promise<unknown>, code: string) =>
  assert.rejects(p, (e: unknown) => e instanceof PresupuestoError && e.code === code);

describe('E-22 · prepararPresupuesto y responderPresupuesto', () => {
  it('counts a budget once the other founder approves it', async () => {
    const id = await prepararPresupuesto(deps, {
      trimestre: '2027-T1',
      montos,
      founderId: 'f1',
      hoy,
    });
    const p = await responderPresupuesto(deps, { id, aprobar: true, founderId: 'f2' });
    assert.equal(p.preparadoPor, 'f1');
    assert.equal(repo.lista[0]?.respuesta?.kind, 'aprobado');
  });

  it('keeps a rejected budget and lets another be prepared', async () => {
    const id = await prepararPresupuesto(deps, {
      trimestre: '2027-T1',
      montos,
      founderId: 'f1',
      hoy,
    });
    await responderPresupuesto(deps, { id, aprobar: false, founderId: 'f2' });
    await prepararPresupuesto(deps, { trimestre: '2027-T1', montos, founderId: 'f1', hoy });
    assert.deepEqual(
      repo.lista.map((p) => p.respuesta?.kind ?? null),
      ['rechazado', null],
    );
  });

  it('refuses a second budget while one waits', async () => {
    await prepararPresupuesto(deps, { trimestre: '2027-T1', montos, founderId: 'f1', hoy });
    await falla(
      prepararPresupuesto(deps, { trimestre: '2027-T1', montos, founderId: 'f2', hoy }),
      'PRESUPUESTO_PENDIENTE',
    );
  });

  it('refuses the founder who prepared it, and an unknown budget', async () => {
    const id = await prepararPresupuesto(deps, {
      trimestre: '2027-T1',
      montos,
      founderId: 'f1',
      hoy,
    });
    await falla(
      responderPresupuesto(deps, { id, aprobar: true, founderId: 'f1' }),
      'PRESUPUESTO_MISMO_SOCIO',
    );
    await falla(
      responderPresupuesto(deps, { id: 'nope', aprobar: true, founderId: 'f2' }),
      'PRESUPUESTO_DESCONOCIDO',
    );
  });

  it('refuses a quarter that ended', async () => {
    await falla(
      prepararPresupuesto(deps, { trimestre: '2026-T3', montos, founderId: 'f1', hoy }),
      'PRESUPUESTO_PASADO',
    );
  });
});

const gasto = (monto: bigint, founderId = 'f1') => ({
  concepto: 'Canva Pro, un año',
  categoria: 'ventas_marketing',
  monto,
  founderId,
  hoy,
});

describe('E-22 · pedirGasto', () => {
  it('approves on its own what fits in the Límite, and asks the other founder above it', async () => {
    const canva = await pedirGasto(deps, gasto(279_00n));
    assert.equal(canva.automatica, true);
    assert.equal(canva.periodo, '2026-11');
    const otra = await pedirGasto(deps, gasto(1_281_01n));
    assert.equal(otra.automatica, false);
  });

  it('measures each founder against their own Límite', async () => {
    await pedirGasto(deps, gasto(1_500_00n, 'f1'));
    assert.equal((await pedirGasto(deps, gasto(1_500_00n, 'f2'))).automatica, true);
  });

  it('uses the fixed Límite with no income', async () => {
    deps = { ...deps, ingresoPromedio: async () => 0n };
    assert.equal((await pedirGasto(deps, gasto(1_000_01n))).automatica, false);
  });

  it('refuses a request without concept, amount or category', async () => {
    await falla(pedirGasto(deps, { ...gasto(1n), concepto: '' }), 'SOLICITUD_CONCEPTO');
    await falla(pedirGasto(deps, gasto(0n)), 'SOLICITUD_MONTO');
    await falla(pedirGasto(deps, { ...gasto(1n), categoria: 'otra' }), 'SOLICITUD_CATEGORIA');
    assert.equal(repo.pedidas.length, 0);
  });
});

describe('E-22 · responderSolicitud', () => {
  const pendiente = () => pedirGasto(deps, gasto(6_000_00n, 'f2'));

  it('approves it whole, or for less', async () => {
    const s = await pendiente();
    await responderSolicitud(deps, { id: s.id, aprobar: true, monto: null, founderId: 'f1' });
    assert.equal(repo.pedidas[0]?.respuesta?.monto, 6_000_00n);
    const t = await pendiente();
    await responderSolicitud(deps, { id: t.id, aprobar: true, monto: 3_000_00n, founderId: 'f1' });
    assert.equal(repo.pedidas[1]?.respuesta?.monto, 3_000_00n);
  });

  it('rejects it with no amount', async () => {
    const s = await pendiente();
    await responderSolicitud(deps, { id: s.id, aprobar: false, monto: 3_000_00n, founderId: 'f1' });
    assert.deepEqual(repo.pedidas[0]?.respuesta?.kind, 'rechazada');
    assert.equal(repo.pedidas[0]?.respuesta?.monto, null);
  });

  it('refuses whoever asked, and a second answer', async () => {
    const s = await pendiente();
    await falla(
      responderSolicitud(deps, { id: s.id, aprobar: true, monto: null, founderId: 'f2' }),
      'SOLICITUD_MISMO_SOCIO',
    );
    await responderSolicitud(deps, { id: s.id, aprobar: false, monto: null, founderId: 'f1' });
    await falla(
      responderSolicitud(deps, { id: s.id, aprobar: true, monto: null, founderId: 'f1' }),
      'SOLICITUD_RESPONDIDA',
    );
  });

  it('refuses more than was asked, and an unknown request', async () => {
    const s = await pendiente();
    await falla(
      responderSolicitud(deps, { id: s.id, aprobar: true, monto: 7_000_00n, founderId: 'f1' }),
      'SOLICITUD_OTRO_MONTO',
    );
    await falla(
      responderSolicitud(deps, { id: 'nope', aprobar: true, monto: null, founderId: 'f1' }),
      'SOLICITUD_DESCONOCIDA',
    );
  });
});
