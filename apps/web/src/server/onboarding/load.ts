import 'server-only';

import {
  activationCodes,
  businesses,
  devices,
  products,
  sales,
  users,
  openingBalances,
} from '@xangarro/data-pg';
import {
  METODOS_CONFIGURABLES,
  answersToConfiguration,
  parseMetodosPago,
  parseWizardAnswers,
  type PlanId,
  type WizardAnswers,
  type WizardConfiguration,
} from '@xangarro/domain';
import { sql, type SQL } from 'drizzle-orm';
import { cache } from 'react';

import type { ChecklistSignals } from '@/onboarding/checklist';

import { withTenant, type Tx } from '../db';
import { reportError } from '../observability/report';
import { pgOnboardingStore } from './store';

/**
 * Reads for the onboarding pages. Each runs in one tenant transaction; RLS
 * scopes every count, so none filters by business.
 */
export interface WizardData {
  readonly answers: WizardAnswers;
  readonly nombreNegocio: string;
  readonly completed: boolean;
}

async function storedAnswers(tx: Tx, businessId: string) {
  const record = await pgOnboardingStore(tx, businessId).find();
  try {
    return { answers: parseWizardAnswers(record?.answers ?? {}), record };
  } catch (error) {
    // A row the domain refuses is reported and shown as a blank wizard; the
    // next save overwrites it with answers that validate.
    reportError(error, { endpoint: 'onboarding/load', businessId });
    return { answers: {}, record };
  }
}

export function loadWizard(businessId: string): Promise<WizardData> {
  return withTenant(businessId, async (tx) => {
    const { answers, record } = await storedAnswers(tx, businessId);
    const [biz] = await tx.select({ nombre: businesses.nombre }).from(businesses);
    return {
      answers: { nombre: biz?.nombre, ...answers },
      nombreNegocio: biz?.nombre ?? '',
      completed: record?.completedAt != null,
    };
  });
}

/** The plan the answers call for, judged against the plan the tenant is on. */
export async function loadRecommendation(
  businessId: string,
  currentPlan: PlanId,
): Promise<WizardConfiguration> {
  const { answers } = await withTenant(businessId, (tx) => storedAnswers(tx, businessId));
  return answersToConfiguration(answers, currentPlan);
}

/** The stored list differs from the full offered set, in any order: someone chose. */
function pagosRevisados(json: string | null | undefined): boolean {
  const chosen = parseMetodosPago(json);
  return chosen.length !== METODOS_CONFIGURABLES.length;
}

/** Whether the business went through «Platícanos de ti» (the gate of P-36 D-2 applies only then). */
export function wizardCompleted(businessId: string): Promise<boolean> {
  return withTenant(businessId, async (tx) => {
    const record = await pgOnboardingStore(tx, businessId).find();
    return record?.completedAt != null;
  });
}

/**
 * Whether any row matches, as 0 or 1: the checklist only asks «is there one?»,
 * and the layout asks on **every** navigation (P-36 D-2). It was
 * `count(*)` — over `sales`, the whole tenant history on every page
 * (DB2-PAGE-01). `EXISTS` stops at the first row.
 */
const hay = (tabla: SQL, filtro: SQL = sql`true`): SQL =>
  sql`(SELECT CASE WHEN EXISTS (SELECT 1 FROM ${tabla} WHERE ${filtro}) THEN 1 ELSE 0 END)`;

type Senales = {
  operadores: number;
  productos: number;
  saldos: number;
  codigos: number;
  dispositivos: number;
  ventas: number;
  logo: string | null;
  rfc: string | null;
  pagos: string | null;
};

const SIN_SENALES: Senales = {
  operadores: 0,
  productos: 0,
  saldos: 0,
  codigos: 0,
  dispositivos: 0,
  ventas: 0,
  logo: null,
  rfc: null,
  pagos: null,
};

function aSenales(r: Senales): ChecklistSignals {
  return {
    operadores: Number(r.operadores),
    productos: Number(r.productos),
    saldosIniciales: Number(r.saldos) > 0,
    codigoGenerado: Number(r.codigos) > 0,
    dispositivosActivos: Number(r.dispositivos),
    ventasSincronizadas: Number(r.ventas),
    tieneLogo: (r.logo ?? '') !== '',
    tieneRfc: (r.rfc ?? '') !== '',
    pagosRevisados: pagosRevisados(r.pagos),
  };
}

/**
 * The checklist's signals in one statement. The counts are 0 or 1 — every
 * reader asks `> 0` — so each is an EXISTS rather than a count.
 *
 * `cache()`: the layout's «Primeros pasos» and Inicio's card read the same
 * signals in one request; they cost one round trip, not two.
 */
export const loadChecklistSignals = cache(
  (businessId: string): Promise<ChecklistSignals> =>
    withTenant(businessId, async (tx) => {
      const [r = SIN_SENALES] = await tx.execute<Senales>(sql`
      SELECT ${hay(sql`${users}`)} AS operadores,
             ${hay(sql`${products}`, sql`deleted_at IS NULL`)} AS productos,
             ${hay(sql`${openingBalances}`, sql`deleted_at IS NULL`)} AS saldos,
             ${hay(sql`${activationCodes}`)} AS codigos,
             ${hay(sql`${devices}`, sql`revoked_at IS NULL`)} AS dispositivos,
             ${hay(sql`${sales}`, sql`deleted_at IS NULL`)} AS ventas,
             b.logo_url AS logo, b.rfc, b.enabled_payment_methods AS pagos
        FROM (SELECT 1) uno
        LEFT JOIN ${businesses} b ON true`);
      return aSenales(r);
    }),
);
