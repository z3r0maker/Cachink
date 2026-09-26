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
import { ROLE_LABEL, type Session } from '@/session/types';
import { initials } from '@/shell/initials';
import { Header } from '@/shell/header';
import type { UserMenuProps } from '@/shell/user-menu';
import { OfflineRegister } from '@/shell/offline-register';
import { Sidebar, type Pasos } from '@/shell/sidebar';

import { column, content, frame, main } from '@/shell/shell.css';

/**
 * The application shell, built once and shared by every portal screen.
 *
 * Navigating between routes must not move it a single pixel — that is the
 * Fase 2 compuerta.
 *
 * The **counts are real**: they come from `sync_rejections`, `notices` and the
 * rows awaiting review, through `loadShellCounts`, which catches so that a
 * database blip degrades three badges instead of handing every route to
 * `global-error`. The Revisión badge was a fixture length until 2026-09-25 —
 * it read 6 in production over a page that said there was nothing to review. The **identity**
 * comes from the session; the switcher lists every business the account
 * belongs to (P-02).
 */
/**
 * P-36 D-2: a new business is walked through «¿Cómo empiezo?» before the
 * portal. A failing read never gates — the shell degrades, it does not lock.
 *
 * The same checklist feeds the sidebar's «Primeros pasos» card (ADR-107):
 * every step, optional ones included, until all are done; never for a
 * read-only role.
 */
async function guiaPrimero(role: string, businessId: string): Promise<Pasos | null> {
  const omitida = (await cookies()).get(GUIA_OMITIDA_COOKIE) !== undefined;
  const [wizard, checklist] = await Promise.all([
    wizardCompleted(businessId).catch(() => false),
    loadChecklistSignals(businessId)
      .then(buildChecklist)
      .catch(() => null),
  ]);
  // Only a business that went through the wizard is sent to the guide; one
  // that predates it (or a failed read) is never locked out of the portal.
  const complete = !wizard || checklist === null || checklist.complete;
  if (debeIrALaGuia({ role, complete, omitida })) redirect('/como-empiezo');
  if (checklist === null || role === 'viewer') return null;
  // The card counts optional steps too: it is the owner's to-do list, not a
  // gate, so it shows whether or not the wizard ran — as Inicio's did.
  const done = checklist.items.filter((i) => i.done).length;
  return done === checklist.items.length ? null : { done, total: checklist.items.length };
}

/** What the account menu shows: the business, the role, the plan and pending rows. */
function accountOf(session: Session, pendingRows: number): UserMenuProps {
  return {
    initials: initials(session.businessName),
    businessName: session.businessName,
    roleLabel: ROLE_LABEL[session.role],
    // The plan from the business's entitlement (B-10), as people name it.
    planLabel: PLAN_NOMBRE[session.planId],
    pendingRows,
  };
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // `currentSession` redirects to /login when the cookie is missing or forged,
  // so nothing below this line renders for a signed-out visitor.
  const session = await currentSession();
  const pasos = await guiaPrimero(session.role, session.businessId);
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
        <Sidebar
          logoUrl={logoUrl}
          badges={{ '/revision-caja': counts.revisionPendiente }}
          current={current}
          negocios={negocios}
          pasos={pasos}
        />
        <div className={column}>
          <Header
            account={accountOf(session, counts.pendingRows)}
            pendingRows={counts.pendingRows}
            unreadNotices={counts.unreadNotices}
          />
          <main className={main}>
            <div className={content}>{children}</div>
          </main>
        </div>
      </div>
    </SessionProvider>
  );
}
