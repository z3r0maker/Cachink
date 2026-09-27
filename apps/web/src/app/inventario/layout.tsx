import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * `/inventario` is development scaffolding (the primitives gallery and the
 * operator states gallery), not a product screen: it answers 404 in a
 * production build. `DEV_PAGES=1` opens it for the local visual review
 * (`e2e/visual.spec.ts`), which runs against a production build.
 */
export default function InventarioLayout({ children }: { readonly children: ReactNode }) {
  if (process.env.NODE_ENV === 'production' && process.env.DEV_PAGES !== '1') notFound();
  return children;
}
