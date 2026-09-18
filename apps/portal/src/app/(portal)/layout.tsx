import { currentSession } from '@/server/current-session';
import { negociosOf } from '@/server/memberships';
import { readSession } from '@/server/session';
import { loadShellCounts } from '@/server/shell';
import { SessionProvider } from '@/session/provider';
import { initials } from '@/shell/initials';
import { Header } from '@/shell/header';
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
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // `currentSession` redirects to /login when the cookie is missing or forged,
  // so nothing below this line renders for a signed-out visitor.
  const session = await currentSession();
  const counts = await loadShellCounts(session.businessId);
  const claims = await readSession();
  const negocios = claims === null ? [] : await negociosOf(claims.sub);
  const current = {
    businessId: session.businessId,
    nombre: session.businessName,
    role: session.role,
  };

  return (
    <SessionProvider session={session}>
      <div className={frame}>
        <Sidebar badges={{ '/revision-caja': pendientesRevision() }} />
        <div className={column}>
          {/* planLabel is still the fixture plan: it rides in the signed
              entitlement (B-06), which has no issuer yet. */}
          <Header
            current={current}
            negocios={negocios}
            planLabel="Xangarro"
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
