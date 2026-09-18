import { currentSession } from '@/server/current-session';
import { loadShellCounts } from '@/server/shell';
import { SessionProvider } from '@/session/provider';
import { Header } from '@/shell/header';
import { Sidebar } from '@/shell/sidebar';
import { column, content, frame, main } from '@/shell/shell.css';

/** "Ana Robledo" → "AR"; a single word gives one letter. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

/**
 * The application shell, built once and shared by every portal screen.
 *
 * Navigating between routes must not move it a single pixel — that is the
 * Fase 2 compuerta.
 *
 * The **counts are real**: they come from `sync_rejections` and `notices`
 * through `loadShellCounts`, which catches so that a database blip degrades two
 * badges instead of handing every route to `global-error`. The **identity**
 * fields are still placeholders until P-02 wires auth and the membership guard
 * — `businessName` in particular is session data, not a query.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // `currentSession` redirects to /login when the cookie is missing or forged,
  // so nothing below this line renders for a signed-out visitor.
  const session = await currentSession();
  const counts = await loadShellCounts(session.businessId);

  return (
    <SessionProvider session={session}>
      <div className={frame}>
        <Sidebar />
        <div className={column}>
          {/* planLabel is still the fixture plan: it rides in the signed
              entitlement (B-06), which has no issuer yet. */}
          <Header
            businessName={session.businessName}
            businessInitials={initials(session.businessName)}
            role={session.role}
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
