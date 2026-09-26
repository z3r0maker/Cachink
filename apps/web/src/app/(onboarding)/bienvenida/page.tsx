import { PLAN_IDS } from '@xangarro/domain';

import { LoadFailed } from '@/onboarding/ui/frame';
import { requireSession } from '@/server/auth';
import { reportError } from '@/server/observability/report';
import { loadWizard } from '@/server/onboarding/load';

import { Wizard } from './wizard';

/**
 * `/bienvenida` — "Platícanos de ti" (N-12). Right after signup, or from
 * "Volver a configurar mi negocio" (`?modo=reconfigurar`, N-15), pre-filled
 * with what was answered before. Signup's `?plan=` rides along to the plan
 * page as a preselection only (ADR-067); an unknown slug is dropped there.
 */
export const dynamic = 'force-dynamic';

type Query = Readonly<Record<'modo' | 'plan', string | undefined>>;

export default async function BienvenidaPage({
  searchParams,
}: {
  readonly searchParams: Promise<Query>;
}) {
  const session = await requireSession();
  const q = await searchParams;
  const data = await loadWizard(session.business_id).catch((error: unknown) => {
    reportError(error, { endpoint: 'bienvenida', businessId: session.business_id });
    return null;
  });
  if (data === null) return <LoadFailed retry="/bienvenida" />;
  const plan = PLAN_IDS.find((p) => p === q.plan);
  const next =
    q.modo === 'reconfigurar'
      ? '/bienvenida/revisar'
      : `/bienvenida/plan${plan === undefined ? '' : `?plan=${plan}`}`;
  return <Wizard initial={data.answers} next={next} intro={q.modo !== 'reconfigurar'} />;
}
