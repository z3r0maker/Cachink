import { logout } from '@/server/actions/auth';
import { requireStaffPage } from '@/server/staff';
import { footer, frame, main, who } from '@/shell/shell.css';
import { Sidebar } from '@/shell/sidebar';
import { buttonQuiet } from '@/styles/ui.css';

/**
 * The console shell. `requireStaffPage()` re-applies the gate here: the proxy
 * is the first check, not the only one.
 */
export default async function ConsolaLayout({ children }: { children: React.ReactNode }) {
  const { staff } = await requireStaffPage();
  return (
    <div className={frame}>
      <Sidebar>
        <div className={footer}>
          <span className={who}>{staff.email}</span>
          <form action={logout}>
            <button className={buttonQuiet} type="submit">
              Cerrar sesión
            </button>
          </form>
        </div>
      </Sidebar>
      <main className={main}>{children}</main>
    </div>
  );
}
