import { DonDice } from '@/components';
import { requireSession } from '@/server/auth';
import { sentryOn } from '@/server/observability/sentry';

import { h1 } from '../ayuda.css';
import * as s from '../escribir.css';
import { FormularioAyuda } from '../formulario';

/**
 * `/ayuda/escribir` (P-48, ADR-162 §8, board `RpAyuda`): «Escríbele al
 * equipo». Any signed-in member, any role: asking for help is never gated.
 *
 * Don's note beside the form says the team usually knows already. That is
 * true only while this server reports its errors (ADR-162 §7, §10), so it is
 * drawn only then.
 */
export default async function EscribirPage() {
  const session = await requireSession();
  return (
    <div className={s.pagina}>
      <h1 className={h1}>Escríbele al equipo</h1>
      <div className={s.cuerpo}>
        <FormularioAyuda nombre={session.nombre} correo={session.email} />
        {sentryOn() ? (
          <DonDice pose="ayuda" size={120}>
            <strong className={s.donTitulo}>Casi siempre ya nos enteramos</strong>
            Cuando el portal falla, nos llega el aviso solo. Si nos cuentas lo que viste, lo
            juntamos con ese aviso y lo arreglamos más rápido.
          </DonDice>
        ) : null}
      </div>
    </div>
  );
}
