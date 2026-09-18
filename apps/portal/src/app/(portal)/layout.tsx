import { Header } from '@/shell/header';
import { Sidebar } from '@/shell/sidebar';
import { column, content, frame, main } from '@/shell/shell.css';

/**
 * The application shell, built once and shared by every portal screen.
 *
 * Navigating between routes must not move it a single pixel — that is the
 * Fase 2 compuerta. The session values below are placeholders until P-02
 * wires Supabase auth and the membership guard.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={frame}>
      <Sidebar />
      <div className={column}>
        <Header
          businessName="Taquería Don Pedro"
          businessInitials="TP"
          role="owner"
          planLabel="Xangarro"
          pendingRows={3}
          unreadNotices={4}
          userInitials="PR"
        />
        <main className={main}>
          <div className={content}>{children}</div>
        </main>
      </div>
    </div>
  );
}
