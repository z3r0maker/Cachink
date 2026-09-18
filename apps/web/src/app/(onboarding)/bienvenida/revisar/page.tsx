import type { BusinessId } from '@xangarro/domain';

import { changeLine } from '@/onboarding/change-copy';
import { LoadFailed } from '@/onboarding/ui/frame';
import { requireSession } from '@/server/auth';
import { reportError } from '@/server/observability/report';
import { previewChanges } from '@/server/onboarding/review';

import { ReviewScreen } from './screen';

/**
 * `/bienvenida/revisar` — N-15's "esto cambiará", computed by the same use
 * case that applies it (`dryRun`). Nothing changes until [Aplicar cambios].
 */
export const dynamic = 'force-dynamic';

export default async function RevisarPage() {
  const session = await requireSession();
  const changes = await previewChanges(session.business_id as BusinessId).catch(
    (error: unknown) => {
      reportError(error, { endpoint: 'bienvenida/revisar', businessId: session.business_id });
      return null;
    },
  );
  if (changes === null) return <LoadFailed retry="/bienvenida/revisar" />;
  return <ReviewScreen lines={changes.map(changeLine)} />;
}
