import { SESSION } from '@/fixtures/business';
import { loadShellCounts } from '@/server/shell';
import { Header } from '@/shell/header';
import { Sidebar } from '@/shell/sidebar';
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
 * fields are still placeholders until P-02 wires auth and the membership guard
 * — `businessName` in particular is session data, not a query.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const counts = await loadShellCounts(SESSION.businessId);

  return (
    <div className={frame}>
      <Sidebar />
      <div className={column}>
        <Header
          businessName="Taquería Don Pedro"
          businessInitials="TP"
          role="owner"
          planLabel="Xangarro"
          pendingRows={counts.pendingRows}
          unreadNotices={counts.unreadNotices}
          userInitials="PR"
        />
        <main className={main}>
          <div className={content}>{children}</div>
        </main>
      </div>
    </div>
  );
}
