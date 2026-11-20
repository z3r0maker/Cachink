import { listPasskeys } from '@/server/auth/manage-passkeys';
import { hora, passkeyDates } from '@/server/auth/passkey-labels';
import { authDeps } from '@/server/auth/wiring';
import { requireStaffPage } from '@/server/staff';
import * as a from '@/styles/mostrador-acceso.css';
import * as m from '@/styles/mostrador.css';
import { torreLight } from '@/styles/theme.css';

import { Llaves, type LlaveFila } from './llaves';

/** Read fresh on every visit: a passkey added or removed elsewhere shows at once. */
export const dynamic = 'force-dynamic';

function ComoFunciona(props: { readonly openedAt: Date; readonly expiresAt: Date }) {
  return (
    <section aria-labelledby="como" className={`${m.panelPad} ${m.stack}`}>
      <h2 id="como" className={a.panelTitle}>
        Cómo funciona
      </h2>
      <ul className={a.lista}>
        <li>
          Entras con Face ID, Touch ID o el PIN de tu equipo. No hay contraseña ni código que
          recordar.
        </li>
        <li>
          Una llave del llavero de iCloud o del administrador de contraseñas de Google llega sola a
          tus otros equipos.
        </li>
        <li>Ten dos llaves en equipos distintos, por ejemplo tu teléfono y tu computadora.</li>
        <li>Si pierdes todas, tu socio te genera un enlace para registrar una nueva.</li>
      </ul>
      <div className={a.sesion}>
        <span className={a.llaveNota}>Esta sesión</span>
        <span>
          Abierta a las {hora(props.openedAt)} · se cierra a las {hora(props.expiresAt)}, o tras 30
          minutos sin uso
        </span>
      </div>
    </section>
  );
}

/** «Mi acceso» (board CD-20c, ADR-160): your passkeys, and how they work. */
export default async function MiAccesoPage() {
  const { session } = await requireStaffPage();
  const now = new Date();
  const llaves: LlaveFila[] = (await listPasskeys(authDeps(), session)).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    sincroniza: p.backedUp,
    fechas: passkeyDates(p.createdAt, p.lastUsedAt, now),
    actual: p.current,
  }));
  return (
    <div className={`${torreLight} ${m.sheet}`}>
      <div className={m.page}>
        <Llaves llaves={llaves}>
          <ComoFunciona openedAt={session.openedAt} expiresAt={session.expiresAt} />
        </Llaves>
      </div>
    </div>
  );
}
