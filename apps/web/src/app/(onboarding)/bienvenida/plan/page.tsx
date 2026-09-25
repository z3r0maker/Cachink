import { PLAN_IDS } from '@xangarro/domain';

import { displayedPlan, headline } from '@/onboarding/plan-copy';
import { LoadFailed } from '@/onboarding/ui/frame';
import { requireSession } from '@/server/auth';
import { betaNoCharge } from '@/server/billing/beta';
import { reportError } from '@/server/observability/report';
import { loadRecommendation } from '@/server/onboarding/load';

import { PlanScreen } from './screen';

/**
 * `/bienvenida/plan` — "Tu plan ideal" (N-13). The recommendation is judged
 * against the free plan, because that is what a new business is on: every
 * answer it cannot honour is listed with "Incluido en …", and kept pending
 * if the owner stays free.
 */
export const dynamic = 'force-dynamic';

export default async function PlanPage({
  searchParams,
}: {
  readonly searchParams: Promise<Readonly<{ plan?: string }>>;
}) {
  const session = await requireSession();
  const { plan: preselected } = await searchParams;
  const config = await loadRecommendation(session.business_id, PLAN_IDS[0]).catch(
    (error: unknown) => {
      reportError(error, { endpoint: 'bienvenida/plan', businessId: session.business_id });
      return null;
    },
  );
  if (config === null) return <LoadFailed retry="/bienvenida/plan" />;
  const plan = displayedPlan(config.suggestedPlan, preselected);
  return (
    <PlanScreen
      plan={plan}
      headline={headline(plan, plan === config.suggestedPlan ? config.reasons : [])}
      pending={config.pendingPaidAnswers}
      beta={betaNoCharge()}
    />
  );
}
