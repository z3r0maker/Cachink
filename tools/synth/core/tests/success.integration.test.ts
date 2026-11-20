import assert from 'node:assert/strict';

import { newUlid } from '@xangarro/domain';
import { asTenant, mintTenant, type Tenant } from '@xangarro/testing/tenant';
import { describe, it } from 'vitest';

import { evaluateSuccess } from '../src/runner/success';
import type { Scenario } from '../src/schemas/scenario';
import { seedRun, type RunAccess } from '../src/seed/seed';
import { businessOf } from '../src/success/business';
import { catalogueScenario } from './catalogue-scenario';

/**
 * S-10's acceptance: each v1 scenario's success, against a run seeded as the
 * scenario seeds it, with the rows a person who did the mission leaves, and
 * with the rows of three ways of not doing it. Opt-in (`test:db`), since it
 * writes to a local database: `pnpm --filter @xangarro/synth-core test:db`.
 */
const RUN = process.env.SYNTH_DB === '1';

const seeded = (s: Scenario): Promise<RunAccess> =>
  seedRun({
    seed: s.start.seed,
    authAs: s.start.auth_as,
    today: '2026-11-20',
    allowedHosts: ['127.0.0.1', 'localhost'],
    label: 'Synth',
  });

const passes = async (biz: string | null, s: Scenario): Promise<boolean> =>
  (await evaluateSuccess(biz, s.success, 0)).every((c) => c.passed);

/** A ticket with `lineas` lines, as the register pushes it. */
async function ticket(
  t: Pick<Tenant, 'biz' | 'deviceId'>,
  o: { lineas: number; metodo?: string; cancelada?: boolean; folio?: number },
): Promise<void> {
  const id = newUlid();
  await asTenant(t.biz, async (sql) => {
    // A line names a product: the seed's catalogue has three.
    const [producto] = await sql`SELECT id FROM products ORDER BY nombre LIMIT 1`;
    await sql`
      INSERT INTO tickets (id, folio, fecha, concepto, metodo, estado_pago, cancelled_at,
                           business_id, device_id, created_at, updated_at)
      VALUES (${id}, ${o.folio ?? 1}, '2026-11-20', 'Venta', ${o.metodo ?? 'Efectivo'}, 'pagado',
              ${o.cancelada === true ? sql`now()` : null}, ${t.biz}, ${t.deviceId}, now(), now())`;
    for (let i = 0; i < o.lineas; i += 1) {
      await sql`
        INSERT INTO sales (id, ticket_id, fecha, concepto, categoria, monto_centavos, producto_id,
                           cantidad, business_id, device_id, created_at, updated_at)
        VALUES (${newUlid()}, ${id}, '2026-11-20', 'Refresco', 'Producto', 2500, ${producto?.id},
                1, ${t.biz}, ${t.deviceId}, now(), now())`;
    }
  });
}

describe.skipIf(!RUN)('primera-venta and the two permisos scenarios', () => {
  for (const id of ['primera-venta', 'permisos-operador', 'permisos-operador-xangarrote']) {
    const s = catalogueScenario(id);
    const lineas = Number(s.success[0]?.params?.partidas);

    it(`${id}: one cash sale that still stands passes`, async () => {
      const { tenant } = await seeded(s);
      assert.ok(tenant);
      await ticket(tenant, { lineas });
      assert.equal(await passes(tenant.biz, s), true);
    });

    it(`${id}: the sale cancelled fails, which is the permission not holding`, async () => {
      const { tenant } = await seeded(s);
      assert.ok(tenant);
      await ticket(tenant, { lineas, cancelada: true });
      assert.equal(await passes(tenant.biz, s), false);
    });

    it(`${id}: no sale, or a second one, fails`, async () => {
      const { tenant } = await seeded(s);
      assert.ok(tenant);
      assert.equal(await passes(tenant.biz, s), false);
      await ticket(tenant, { lineas });
      await ticket(tenant, { lineas, folio: 2 });
      assert.equal(await passes(tenant.biz, s), false);
    });

    it(`${id}: a card sale fails: the mission is paid in cash`, async () => {
      const { tenant } = await seeded(s);
      assert.ok(tenant);
      await ticket(tenant, { lineas, metodo: 'Tarjeta' });
      assert.equal(await passes(tenant.biz, s), false);
    });
  }
});

/** The turno the register closes, as it pushes it. */
async function turno(
  t: Pick<Tenant, 'biz' | 'deviceId'>,
  userId: string,
  o: { cerrado: boolean; contado: number; diferencia: number },
): Promise<void> {
  await asTenant(
    t.biz,
    (sql) => sql`
    INSERT INTO caja_turnos (id, user_id, fecha, apertura_at, cierre_at, monto_apertura_centavos,
                             efectivo_adicional_centavos, monto_cierre_centavos,
                             efectivo_esperado_centavos, diferencia_centavos,
                             business_id, device_id, created_at, updated_at)
    VALUES (${newUlid()}, ${userId}, '2026-11-20', now() - interval '8 hours',
            ${o.cerrado ? sql`now()` : null}, 50000, 0,
            ${o.cerrado ? o.contado : null}, ${o.cerrado ? o.contado - o.diferencia : null},
            ${o.cerrado ? o.diferencia : null}, ${t.biz}, ${t.deviceId}, now(), now())`,
  );
}

describe.skipIf(!RUN)('corte-de-caja', () => {
  const s = catalogueScenario('corte-de-caja');
  const contado = Number(s.success.find((c) => c.check === 'corte-cuadrado')?.params?.contado);

  const withSale = async () => {
    const access = await seeded(s);
    assert.ok(access.tenant);
    await ticket(access.tenant, { lineas: 1 });
    return { tenant: access.tenant, operador: access.operators[0]?.id ?? '' };
  };

  it('the sale, then the turno closed with the cash counted and no difference, passes', async () => {
    const { tenant, operador } = await withSale();
    await turno(tenant, operador, { cerrado: true, contado, diferencia: 0 });
    assert.equal(await passes(tenant.biz, s), true);
  });

  it('a turno still open fails', async () => {
    const { tenant, operador } = await withSale();
    await turno(tenant, operador, { cerrado: false, contado, diferencia: 0 });
    assert.equal(await passes(tenant.biz, s), false);
  });

  it('a close that counted other cash, or that left a difference, fails', async () => {
    const short = await withSale();
    await turno(short.tenant, short.operador, {
      cerrado: true,
      contado: contado - 100,
      diferencia: 0,
    });
    assert.equal(await passes(short.tenant.biz, s), false);
    const off = await withSale();
    await turno(off.tenant, off.operador, { cerrado: true, contado, diferencia: 500 });
    assert.equal(await passes(off.tenant.biz, s), false);
  });

  it('a close with no sale before it fails: the corte is of a day that sold', async () => {
    const access = await seeded(s);
    assert.ok(access.tenant);
    await turno(access.tenant, access.operators[0]?.id ?? '', {
      cerrado: true,
      contado,
      diferencia: 0,
    });
    assert.equal(await passes(access.tenant.biz, s), false);
  });
});

/** What signup and the wizard leave: an owner with that address, and the answers. */
async function signedUp(o: { pasos: number; terminado: boolean }): Promise<Tenant> {
  const t = await mintTenant({ label: 'Lupita', plan: 'free' });
  const all = {
    nombre: 'Abarrotes Lupita',
    metodosCobro: ['Efectivo'],
    manejaInventario: false,
    manejaCajaEfectivo: true,
    vendeACredito: true,
    hasLogo: false,
    tieneDatosFiscales: false,
    personasQueCobran: 1,
  };
  const answers = Object.fromEntries(Object.entries(all).slice(0, o.pasos));
  await asTenant(
    t.biz,
    (sql) => sql`
    INSERT INTO business_onboarding (business_id, answers, completed_at, updated_at)
    VALUES (${t.biz}, ${sql.json(answers)}, ${o.terminado ? sql`now()` : null}, now())`,
  );
  return t;
}

describe.skipIf(!RUN)('onboarding-camino-a', () => {
  const s = catalogueScenario('onboarding-camino-a');

  it('the seeded run has no business until the actor signs up', async () => {
    const access = await seeded(s);
    assert.equal(access.tenant, null);
    assert.equal(await businessOf(access.account.email), null);
    assert.equal(await passes(null, s), false);
  });

  it('an owner with all eight steps answered and the plan chosen passes', async () => {
    const t = await signedUp({ pasos: 8, terminado: true });
    const biz = await businessOf(t.email);
    assert.equal(biz, t.biz);
    assert.equal(await passes(biz, s), true);
  });

  it('a step skipped fails: camino A answers everything', async () => {
    const t = await signedUp({ pasos: 7, terminado: true });
    assert.equal(await passes(await businessOf(t.email), s), false);
  });

  it('all answered but no plan chosen fails: the wizard was left before «Tu plan ideal»', async () => {
    const t = await signedUp({ pasos: 8, terminado: false });
    assert.equal(await passes(await businessOf(t.email), s), false);
  });
});
