import { requireFounderPage } from '@/server/founder';

/**
 * «Empresa» (ADR-124): founders only. A staff member who is not one gets a
 * 404 from every page under here, before any of it renders.
 */
export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  await requireFounderPage();
  return children;
}
