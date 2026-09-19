import { ImportarScreen } from './parts';
import type { TemplateId } from '@/server/import/templates';

/**
 * `/importar` (N-16): the multi-template import screen. Bare, it opens on
 * the template chooser; `?plantilla=productos|clientes` starts in that
 * template's flow — the Productos screen's button sends `productos`.
 */
export default async function ImportarPage({
  searchParams,
}: {
  searchParams: Promise<{ plantilla?: string }>;
}) {
  const { plantilla } = await searchParams;
  const inicial: TemplateId | null =
    plantilla === 'productos' || plantilla === 'clientes' ? plantilla : null;
  return <ImportarScreen inicial={inicial} />;
}
