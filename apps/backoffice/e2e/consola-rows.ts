import { newUlid, PLATFORM_FLAG_DEFAULTS, resolvePlatformFlags } from '@xangarro/domain';
import {
  createDb,
  tenantPlanOverrides,
  tenantPlatformRules,
  withBusiness,
} from '@xangarro/data-pg';

import { withSuper, type ConsolaTenant } from './consola-fixture';

/**
 * Rows the console sweep composes onto its minted business, and the reads
 * that hold the pages to them. The seed carries no assisted import, no geo
 * counter and no signup attribution, so each page's figure is one of these.
 */

/** Two «Hazlo por mí» requests: one to review, one already sent back to the tenant. */
export interface Migraciones {
  readonly enRevision: string;
  readonly enviada: string;
  readonly archivo: string;
  readonly mapeado: string;
  readonly bytes: Buffer;
  readonly notas: string;
}

export async function sembrarMigraciones(t: ConsolaTenant): Promise<Migraciones> {
  const m: Migraciones = {
    enRevision: newUlid(),
    enviada: newUlid(),
    archivo: `inventario-${t.sello}.csv`,
    mapeado: `productos-${t.sello}.csv`,
    // ~2.4 KB of CSV: the detail page rounds it up to «(3 KB)».
    bytes: Buffer.from(`sku,nombre\n${'E2E-1,Tortilla\n'.repeat(160)}`),
    notas: `Las existencias vienen del Excel ${t.sello}`,
  };
  await withSuper(async (sql) => {
    const solicitud = (id: string, status: string, plantilla: string | null, ago: string) => sql`
      INSERT INTO assisted_imports (id, business_id, status, sistema_actual, notas, plantilla,
                                    device_id, created_at, updated_at)
      VALUES (${id}, ${t.biz}, ${status}, 'Eleventa', ${m.notas}, ${plantilla}, 'e2e',
              now() - ${ago}::interval, now())`;
    await solicitud(m.enRevision, 'revision', null, '0 seconds');
    await solicitud(m.enviada, 'esperando_aprobacion', 'clientes', '1 day');
    const archivo = (importId: string, role: string, filename: string) => sql`
      INSERT INTO assisted_import_files (id, assisted_import_id, business_id, role, filename,
                                         mime, size_bytes, bytes)
      VALUES (${newUlid()}, ${importId}, ${t.biz}, ${role}, ${filename}, 'text/csv',
              ${m.bytes.length}, ${m.bytes})`;
    await archivo(m.enRevision, 'solicitud', m.archivo);
    await archivo(m.enviada, 'solicitud', m.archivo);
    await archivo(m.enviada, 'mapeado', m.mapeado);
  });
  return m;
}

/** Zacatecas: the state the sweep's traffic and signups come from. */
export const ESTADO = { code: 'ZAC', nombre: 'Zacatecas' } as const;
export const HITS = { login: 7, landing: 40, compra: 5 } as const;

/**
 * Three days ago (CDMX), inside every range the pages offer. The counters are
 * a daily aggregate with no business in them, so the spec adds its hits onto
 * whatever the row holds and takes them back off afterwards.
 */
export async function sembrarTrafico(sign: 1 | -1): Promise<void> {
  await withSuper(async (sql) => {
    for (const [source, hits] of Object.entries(HITS)) {
      await sql`
        INSERT INTO xangarro.geo_counters (day, source, country, region, hits)
        VALUES ((now() AT TIME ZONE 'America/Mexico_City')::date - 3, ${source}, 'MX',
                ${ESTADO.code}, ${Math.max(hits * sign, 0)})
        ON CONFLICT (day, source, country, region)
        DO UPDATE SET hits = greatest(xangarro.geo_counters.hits + ${hits * sign}, 0)`;
    }
    await sql`DELETE FROM xangarro.geo_counters WHERE hits = 0`;
  });
}

/** A campaign of four signups, three from Zacatecas, keyed by the sweep's stamp. */
export async function sembrarAltas(t: ConsolaTenant): Promise<string> {
  const campaign = `e2e-${t.sello}`;
  await withSuper(async (sql) => {
    for (const [i, region] of ['ZAC', 'ZAC', 'ZAC', 'JAL'].entries()) {
      await sql`
        INSERT INTO xangarro.signup_attribution (business_id, created_at, source, medium,
                                                 campaign, country, region)
        VALUES (${`${campaign}-${i}`}, now() - interval '2 days', 'facebook', 'cpc',
                ${campaign}, 'MX', ${region})`;
    }
  });
  return campaign;
}

export async function borrarAltas(campaign: string): Promise<void> {
  await withSuper(
    (sql) => sql`DELETE FROM xangarro.signup_attribution WHERE campaign = ${campaign}`,
  );
}

/** What a page must show, read from the same tables over the same window. */
export async function cifra(query: string): Promise<number> {
  return withSuper(async (sql) => {
    const rows = await sql.unsafe(query);
    return Number((rows[0] as { n?: unknown } | undefined)?.n ?? 0);
  });
}

/** The portal's own login (`xangarro_app`) on the same database as the fixtures. */
function appUrl(): string {
  const url = new URL(process.env.DATABASE_SUPER_URL ?? '');
  url.username = 'xangarro_app';
  url.password = 'xangarro_app';
  return url.toString();
}

/**
 * What the tenant's entitlement reads, the way the portal reads it
 * (`apps/web/src/server/billing/plan.ts`): the platform rules and the plan
 * overrides through the tenant-scoped definer functions, as the app role,
 * inside the tenant's transaction, then resolved by the domain.
 */
export async function loQueVeElNegocio(businessId: string) {
  const db = createDb(appUrl(), { max: 1 });
  try {
    return await withBusiness(db, businessId, async (tx) => {
      const rules = await tenantPlatformRules(tx);
      const overrides = await tenantPlanOverrides(tx);
      return {
        rules,
        overrides,
        platform: resolvePlatformFlags(businessId, rules, PLATFORM_FLAG_DEFAULTS),
      };
    });
  } finally {
    await db.$client.end({ timeout: 5 });
  }
}
