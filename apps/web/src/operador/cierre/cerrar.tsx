import { Icon } from '../../shell/icon';
import * as c from './cerrar.css';
import { cerrarHint, cerrarLabel } from './copy';
import type { Cierre } from './use-cierre';

const CANDADO = 'M5 11h14v10H5V11Zm2 0V7a5 5 0 0 1 10 0v4';

/** The one close button, the difference in its words; blocked only while the reason is missing. */
export function Cerrar({ x }: { readonly x: Cierre }) {
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
      <span id="cerrar-por" className={c.hint}>
        {cerrarHint(x.faltaMotivo, x.faltaNota)}
      </span>
    </div>
  );
}
