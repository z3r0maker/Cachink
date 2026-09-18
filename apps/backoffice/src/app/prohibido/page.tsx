import { logout } from '@/server/actions/auth';
import { body, buttonQuiet, card, centered, heading } from '@/styles/ui.css';

/**
 * The 403. The proxy rewrites here with status 403 when a signed-in user is
 * not on the `staff_members` allowlist. It names no reason beyond that and
 * offers no way in — access is granted by adding a row, not by asking here.
 */
export default function ProhibidoPage() {
  return (
    <main className={centered}>
      <section className={card} aria-labelledby="forbidden-title">
        <h1 id="forbidden-title" className={heading}>
          Sin acceso
        </h1>
        <p className={body}>
          Tu cuenta no está autorizada para la consola interna de Xangarro. Si eres dueño de un
          negocio, entra en app.xangarro.mx.
        </p>
        <form action={logout}>
          <button className={buttonQuiet} type="submit">
            Cerrar sesión
          </button>
        </form>
      </section>
    </main>
  );
}
