import { PLAN_NOMBRE } from '@xangarro/domain';
import { Suspense } from 'react';

import { buildChecklist } from '@/onboarding/checklist';
import { accessDeps } from '@/server/acceso/live';
import { estadoSeguridad, type EstadoSeguridad } from '@/server/acceso/seguridad';
import { currentSession } from '@/server/current-session';
import { loadChecklistSignals } from '@/server/onboarding/load';
import { negociosOf } from '@/server/memberships';
import { readSession, type SessionClaims } from '@/server/session';
import { avisoNuevoPara } from '@/server/privacidad/estado';
import { loadShellCounts, loadShellLogo } from '@/server/shell';
import { SessionProvider } from '@/session/provider';
import { ROLE_LABEL, type Session } from '@/session/types';
import { AvisoNuevoFranja } from '@/shell/aviso-nuevo';
import { initials } from '@/shell/initials';
import { Header } from '@/shell/header';
import type { UserMenuProps } from '@/shell/user-menu';
import { OfflineRegister } from '@/shell/offline-register';
import { ReconfirmarProvider } from '@/shell/reconfirmar';
import { InvitacionFranja, RecuperacionFranja } from '@/shell/seguridad-franjas';
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
 * belongs to (P-02). `ReconfirmarProvider` holds the second factor's re-ask
 * dialog, which any screen below may open (N-83).
 */
/**
 * The sidebar's «Primeros pasos» card (ADR-107): every step, optional ones
 * included, until all are done; never for a read-only role. The checklist is
 * a portal page like any other — nothing redirects to it (P-36 D-2 reversed:
 * a new owner lands there from onboarding and moves freely from then on).
 */
async function guiaPrimero(role: string, businessId: string): Promise<Pasos | null> {
  if (role === 'viewer') return null;
  const checklist = await loadChecklistSignals(businessId)
    .then(buildChecklist)
    .catch(() => null);
  if (checklist === null) return null;
  const done = checklist.items.filter((i) => i.done).length;
  return done === checklist.items.length ? null : { done, total: checklist.items.length };
}

/** What the account menu shows: the business, the role, the plan and pending rows. */
function accountOf(
  session: Session,
  pendingRows: number,
  avisoNuevo: boolean,
  seguridad: boolean,
): UserMenuProps {
  return {
    initials: initials(session.businessName),
    businessName: session.businessName,
    roleLabel: ROLE_LABEL[session.role],
    // The plan from the business's entitlement (B-10), as people name it.
    planLabel: PLAN_NOMBRE[session.planId],
    pendingRows,
    avisoNuevo,
    seguridad,
  };
}

/**
 * The account's second factor (N-83), for the menu's «Seguridad» and its two
 * strips. Owner and admin only; a failed read hides them rather than taking
 * the shell down with it.
 */
async function seguridadDe(claims: SessionClaims | null): Promise<EstadoSeguridad | null> {
  if (claims === null || claims.member_role === 'viewer') return null;
  return estadoSeguridad(accessDeps(), claims.sub).catch(() => null);
}

/** What is the person's rather than the business's: memberships, the aviso, the second factor. */
async function deLaPersona(claims: SessionClaims | null) {
  if (claims === null) return { negocios: [], avisoNuevo: false, seguridad: null };
  return {
    negocios: await negociosOf(claims.sub),
    avisoNuevo: await avisoNuevoPara(claims.sub),
    seguridad: await seguridadDe(claims),
  };
}

/** The strips above every page: the new aviso, and the second factor's two (N-83). */
function Franjas(props: {
  readonly avisoNuevo: boolean;
  readonly seguridad: EstadoSeguridad | null;
}) {
  const { seguridad } = props;
  return (
    <>
      <AvisoNuevoFranja visible={props.avisoNuevo} />
      <InvitacionFranja visible={seguridad?.invitar === true} />
      <Suspense fallback={null}>
        <RecuperacionFranja codigos={seguridad?.activa ? seguridad.codigos : null} />
      </Suspense>
    </>
  );
}

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  // `currentSession` redirects to /login when the cookie is missing or forged,
  // so nothing below this line renders for a signed-out visitor.
  const session = await currentSession();
  const pasos = await guiaPrimero(session.role, session.businessId);
  const counts = await loadShellCounts(session.businessId);
  const logoUrl = await loadShellLogo(session.businessId);
  const { negocios, avisoNuevo, seguridad } = await deLaPersona(await readSession());
  const current = {
    businessId: session.businessId,
    nombre: session.businessName,
    role: session.role,
  };

  return (
    <SessionProvider session={session}>
      {/* N-23: the offline page's service worker, on the Director surface only. */}
      <OfflineRegister />
      <ReconfirmarProvider>
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
              account={accountOf(session, counts.pendingRows, avisoNuevo, seguridad !== null)}
              pendingRows={counts.pendingRows}
              unreadNotices={counts.unreadNotices}
            />
            <Franjas avisoNuevo={avisoNuevo} seguridad={seguridad} />
            <main className={main}>
              <div className={content}>{children}</div>
            </main>
          </div>
        </div>
      </ReconfirmarProvider>
    </SessionProvider>
  );
}
