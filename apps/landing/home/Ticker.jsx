import { MARK_BOX, MARK_X } from './icons.jsx';
import { useInView } from './use-in-view.js';

const WORDS = [
  'Ventas',
  'Gastos',
  'Caja y turnos',
  'Inventario',
  'Fiado y cobranza',
  'Estados NIF',
  'Metas',
  'Don Cuentas',
  'Cortes',
  'Excel',
];

function X() {
  return (
    <svg viewBox={MARK_BOX} width="13" height="13" aria-hidden="true">
      <path d={MARK_X} fill="var(--yellow)" />
    </svg>
  );
}

/** The scrolling strip under the hero. Decorative: the words repeat the page's sections. */
export function Ticker() {
  const ref = useInView();
  const words = [...WORDS, ...WORDS];
  return (
    <div className="ticker" ref={ref} data-motion="" aria-hidden="true">
      <div className="ticker-track a-marquee">
        {words.map((w, i) => (
          <span key={i} className="ticker-item">
            {w}
            <X />
          </span>
        ))}
      </div>
    </div>
  );
}
