import { requireFounderPage } from '@/server/founder';
import { rejilla } from '@/styles/mostrador-movimiento.css';
import { sheet } from '@/styles/mostrador.css';
import { torreLight } from '@/styles/theme.css';

/**
 * «Empresa» (ADR-125): founders only. A staff member who is not one gets a
 * 404 from every page under here, before any of it renders. The area reads in
 * El Mostrador, light, inside the console's dark rail, on
 * ADR-161's «rejilla»: a still grid behind every Empresa page.
 */
export default async function EmpresaLayout({ children }: { children: React.ReactNode }) {
  await requireFounderPage();
  return <div className={`${torreLight} ${sheet} ${rejilla}`}>{children}</div>;
}
