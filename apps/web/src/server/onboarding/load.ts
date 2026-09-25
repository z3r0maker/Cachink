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
import { count, isNull } from 'drizzle-orm';

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

const n = (rows: { n: number }[]) => rows[0]?.n ?? 0;

/** The stored list differs from the default four, in any order: someone chose. */
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

export function loadChecklistSignals(businessId: string): Promise<ChecklistSignals> {
  return withTenant(businessId, async (tx) => {
    const c = { n: count() };
    const [biz] = await tx
      .select({
        logo: businesses.logoUrl,
        rfc: businesses.rfc,
        pagos: businesses.enabledPaymentMethods,
      })
      .from(businesses);
    return {
      operadores: n(await tx.select(c).from(users)),
      productos: n(await tx.select(c).from(products).where(isNull(products.deletedAt))),
      saldosIniciales:
        n(await tx.select(c).from(openingBalances).where(isNull(openingBalances.deletedAt))) > 0,
      codigoGenerado: n(await tx.select(c).from(activationCodes)) > 0,
      dispositivosActivos: n(await tx.select(c).from(devices).where(isNull(devices.revokedAt))),
      ventasSincronizadas: n(await tx.select(c).from(sales).where(isNull(sales.deletedAt))),
      tieneLogo: biz?.logo != null && biz.logo !== '',
      tieneRfc: biz?.rfc != null && biz.rfc !== '',
      pagosRevisados: pagosRevisados(biz?.pagos),
    };
  });
}
