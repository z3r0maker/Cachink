import * as s from './campanas.css';
import { pasos, type Embudo } from './embudo';

/**
 * Visita → checkout → alta for the period. The first two come from the Mapa's
 * rollup and the last from attribution, so they are read side by side, not
 * as one tracked path.
 */
export function EmbudoView({ e }: { readonly e: Embudo | null }) {
  if (e === null) return null;
  const max = Math.max(e.visitas, e.checkouts, e.altas, 1);
  return (
    <>
      <ol className={s.embudo} aria-label="Embudo del periodo">
        {pasos(e).map((p) => (
          <li key={p.label} className={s.paso}>
            <span>{p.label}</span>
            <progress className={s.bar} value={p.value} max={max} aria-label={p.label} />
            <span className={s.num}>{p.value.toLocaleString('es-MX')}</span>
            <span className={s.rate}>{p.rate === null ? '' : `${p.rate} %`}</span>
          </li>
        ))}
      </ol>
      <p className={s.foot}>
        Visitas y checkouts del Mapa en el mismo periodo (México); altas por campaña. Una alta no
        siempre pasa por el checkout.
      </p>
    </>
  );
}
