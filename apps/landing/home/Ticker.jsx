import { useInView } from './useInView.js';

const WORDS = ['Ventas', 'Gastos', 'Caja y turnos', 'Inventario', 'Fiado y cobranza', 'Estados NIF', 'Metas', 'Don Cuentas', 'Cortes', 'Excel'];

function X() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path d="M5 5L19 19M19 5L5 19" stroke="var(--yellow)" strokeWidth="4.6" />
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
