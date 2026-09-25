import { PLAN_NOMBRE } from '@xangarro/domain';

import { currentSession } from '@/server/current-session';
import { negociosOf } from '@/server/memberships';
import { readSession } from '@/server/session';
import { loadShellCounts, loadShellLogo } from '@/server/shell';
import { SessionProvider } from '@/session/provider';
import { initials } from '@/shell/initials';
import { Header } from '@/shell/header';
import { OfflineRegister } from '@/shell/offline-register';
import { Sidebar } from '@/shell/sidebar';

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
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // `currentSession` redirects to /login when the cookie is missing or forged,
  // so nothing below this line renders for a signed-out visitor.
  const session = await currentSession();
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
        <Sidebar logoUrl={logoUrl} badges={{ '/revision-caja': counts.revisionPendiente }} />
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
