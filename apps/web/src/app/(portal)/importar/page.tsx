import { HazloPorMi } from './hazlo-por-mi';
import { ImportarScreen } from './parts';
import { importacionAsistidaActual, planDelNegocio } from '@/server/actions/hazlo-por-mi';
import { requireMember } from '@/server/auth';
import type { TemplateId } from '@/server/import/templates';

/**
 * `/importar` (N-16): the multi-template import screen, plus N-18's «Hazlo
 * por mí» card under the chooser. Bare, it opens on the template chooser;
 * `?plantilla=productos|clientes` starts in that template's flow.
 */
export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ plantilla?: string }>;
}) {
  const { plantilla } = await searchParams;
  const inicial: TemplateId | null =
    plantilla === 'productos' || plantilla === 'clientes' ? plantilla : null;

  const session = await requireMember('viewer');
  const [plan, asistida] = await Promise.all([
    planDelNegocio(session.business_id),
    importacionAsistidaActual(session.business_id),
  ]);

  return (
    <>
      <ImportarScreen inicial={inicial} />
      <HazloPorMi
        paid={plan !== 'xangarrito'}
        mayWrite={session.member_role !== 'viewer'}
        status={asistida?.status ?? null}
        fileCount={asistida?.files.length ?? 0}
      />
    </>
  );
}
