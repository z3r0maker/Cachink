import { logout } from '@/server/actions/auth';
import { requireStaffPage } from '@/server/staff';
import { OPEN_ITEMS_CAP, openInboxItems } from '@/server/torre/readings';
import { column, footer, frame, main, who } from '@/shell/shell.css';
import { Sidebar, type NavCount } from '@/shell/sidebar';
import { StatusBar } from '@/shell/status-bar';
import { torreDark } from '@/styles/theme.css';
import { buttonQuiet, muted } from '@/styles/ui.css';

/**
 * The console shell, «Torre de Control»: dark rail, status bar, work area.
 * `requireStaffPage()` re-applies the gate here: the proxy is the first
 * check, not the only one.
 */
export default async function ConsolaLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaffPage();
  const open = await openInboxItems();
  const inbox: NavCount | undefined =
    open === null
      ? undefined
      : {
          label: open.length >= OPEN_ITEMS_CAP ? `${OPEN_ITEMS_CAP}+` : String(open.length),
          hot: open.some((i) => i.urgent),
        };
  return (
    <div className={`${torreDark} ${frame}`}>
      <Sidebar counts={inbox === undefined ? {} : { '/inbox': inbox }}>
        <div className={footer}>
          <span className={muted}>Turno</span>
          <span className={who}>{staff.email}</span>
          <form action={logout}>
            <button className={buttonQuiet} type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </Sidebar>
      <div className={column}>
        <StatusBar />
        <main className={main}>{children}</main>
      </div>
    </div>
  );
}
