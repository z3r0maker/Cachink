import { OperadorEstado, type EstadoMode } from '@/operador/estado';

const MODES: readonly EstadoMode[] = ['loading', 'empty', 'error'];

/**
 * Development scaffolding for Track O: renders one operator primitive with
 * fixed props, so it can be captured beside its design file at the same width
 * (`?mode=loading|empty|error`, default `empty` like the design's control;
 * `&cta=1` adds the empty state's action).
 */
export default async function OperadorGallery({
  searchParams,
}: {
  readonly searchParams: Promise<{ readonly mode?: string; readonly cta?: string }>;
}) {
  const { mode, cta } = await searchParams;
  const picked = MODES.find((m) => m === mode) ?? 'empty';
  // 8 px mirrors the default body margin the design runtime renders with.
  return (
    <div style={{ padding: 8 }}>
      <OperadorEstado mode={picked} {...(cta ? { cta: 'Ir a la caja', href: '/caja' } : {})} />
    </div>
  );
}
