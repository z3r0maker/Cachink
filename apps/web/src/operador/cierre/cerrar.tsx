import { Icon } from '../../shell/icon';
import * as c from './cerrar.css';
import { cerrarHint, cerrarLabel } from '@xangarro/caja/cierre';
import type { Cierre } from './use-cierre';

const CANDADO = 'M5 11h14v10H5V11Zm2 0V7a5 5 0 0 1 10 0v4';
const RELOJ = 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2';

/** The one close button, the difference in its words; blocked while records or the reason are missing. */
export function Cerrar({ x }: { readonly x: Cierre }) {
  const espera = x.pendientes > 0;
  return (
    <div className={c.pie}>
      <button
        type="button"
        className={c.cerrar}
        data-onyellow=""
        disabled={!x.puede}
        aria-describedby="cerrar-por"
        onClick={x.cerrar}
      >
        <Icon path={CANDADO} size={20} strokeWidth={2.4} />
        {cerrarLabel(x.dif)}
      </button>
      {espera ? (
        <span id="cerrar-por" className={c.hint} data-espera="">
          <Icon path={RELOJ} size={16} strokeWidth={2.4} />
          {`Espera a que se envíen los ${x.pendientes} registros`}
        </span>
      ) : (
        <span id="cerrar-por" className={c.hint}>
          {cerrarHint(x.faltaMotivo, x.faltaNota)}
        </span>
      )}
    </div>
  );
}
