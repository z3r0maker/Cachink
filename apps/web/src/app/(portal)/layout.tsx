import { PLAN_NOMBRE } from '@xangarro/domain';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { buildChecklist } from '@/onboarding/checklist';
import { GUIA_OMITIDA_COOKIE, debeIrALaGuia } from '@/onboarding/guia';
import { currentSession } from '@/server/current-session';
import { loadChecklistSignals, wizardCompleted } from '@/server/onboarding/load';
import { negociosOf } from '@/server/memberships';
import { readSession } from '@/server/session';
import { loadShellCounts, loadShellLogo } from '@/server/shell';
import { SessionProvider } from '@/session/provider';
import { initials } from '@/shell/initials';
import { Header } from '@/shell/header';
import { OfflineRegister } from '@/shell/offline-register';
import { Sidebar } from '@/shell/sidebar';

import { pendientesRevision } from './revision-caja/pendientes';
import { column, content, frame, main } from '@/shell/shell.css';

/**
 * The application shell, built once and shared by every portal screen.
 *
 * Navigating between routes must not move it a single pixel — that is the
 * Fase 2 compuerta.
 *
 * The **counts are real**: they come from `sync_rejections` and `notices`
 * through `loadShellCounts`, which catches so that a database blip degrades two
 * badges instead of handing every route to `global-error`. The **identity**
 * comes from the session; the switcher lists every business the account
 * belongs to (P-02).
 */
/**
 * P-36 D-2: a new business is walked through «¿Cómo empiezo?» before the
 * portal. A failing read never gates — the shell degrades, it does not lock.
 */
async function guiaPrimero(role: string, businessId: string): Promise<void> {
  const omitida = (await cookies()).get(GUIA_OMITIDA_COOKIE) !== undefined;
  if (!debeIrALaGuia({ role, complete: false, omitida })) return;
  // Only a business that finished the wizard is walked; a seeded or older one is not.
  const complete = await wizardCompleted(businessId)
    .then((wizard) => (wizard ? loadChecklistSignals(businessId) : null))
    .then((signals) => signals === null || buildChecklist(signals).complete)
    .catch(() => true);
  if (debeIrALaGuia({ role, complete, omitida })) redirect('/como-empiezo');
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // `currentSession` redirects to /login when the cookie is missing or forged,
  // so nothing below this line renders for a signed-out visitor.
  const session = await currentSession();
  await guiaPrimero(session.role, session.businessId);
  const counts = await loadShellCounts(session.businessId);
  const logoUrl = await loadShellLogo(session.businessId);
  const claims = await readSession();
  const negocios = claims === null ? [] : await negociosOf(claims.sub);
  const current = {
    businessId: session.businessId,
    nombre: session.businessName,
    role: session.role,
  };

  return (
    <SessionProvider session={session}>
      {/* N-23: the offline page's service worker, on the Director surface only. */}
      <OfflineRegister />
      <div className={frame}>
        <Sidebar logoUrl={logoUrl} badges={{ '/revision-caja': pendientesRevision() }} />
        <div className={column}>
          {/* The plan from the business's entitlement (B-10), as people name it. */}
          <Header
            current={current}
            negocios={negocios}
            planLabel={PLAN_NOMBRE[session.planId]}
            pendingRows={counts.pendingRows}
            unreadNotices={counts.unreadNotices}
            userInitials={initials(session.businessName)}
          />
          <main className={main}>
            <div className={content}>{children}</div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
