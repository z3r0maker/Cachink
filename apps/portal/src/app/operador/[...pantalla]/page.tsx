import { notFound } from 'next/navigation';

import { PendingScreen } from '@/operador/pending-screen';

/** Every operator destination whose screen task has not run yet. A real
 *  `operador/<name>/page.tsx` outranks this catch-all as each one lands. */
const PENDING = new Set(['ventas', 'gastos', 'inventario', 'cobranza', 'pendientes', 'cierre']);

export default async function PendingOperadorPage({
  params,
}: {
  readonly params: Promise<{ readonly pantalla: readonly string[] }>;
}) {
  const { pantalla } = await params;
  if (pantalla.length !== 1 || !PENDING.has(pantalla[0] ?? '')) notFound();
  return <PendingScreen />;
}
