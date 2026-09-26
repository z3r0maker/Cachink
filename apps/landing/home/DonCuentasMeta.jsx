import { sealPath } from './icons.jsx';

const SEAL = sealPath(220, 8);

/** The running goal and August's stamp, slammed down when the bar fills. */
export function DonCuentasMeta() {
  return (
    <div className="dc-meta">
      <div className="xcard dc-goal g-thump">
        <div className="dc-goal-top">
          <span className="xeyebrow">Meta de septiembre</span>
          <span className="xtag" style={{ background: 'var(--green-soft)' }}>
            Adelantado
          </span>
        </div>
        <div className="dc-goal-title">Vender 20% más para comprar el segundo trompo</div>
        <div className="dc-track" role="img" aria-label="86% de la meta">
          <div className="g-fill" />
        </div>
        <div className="dc-goal-nums num">
          <span>$158,240.00 de $184,000.00</span>
          <span>86%</span>
        </div>
      </div>
      <div className="dc-seal">
        <div className="g-slam">
          <svg viewBox="0 0 220 220" aria-hidden="true">
            <path d={SEAL} fill="var(--white)" transform="translate(10 10)" />
            <path d={SEAL} fill="var(--black)" transform="translate(4 4)" />
          </svg>
          <div className="dc-seal-txt">
            <span>Meta lograda</span>
            <strong>Agosto</strong>
            <span>Racha de 3 meses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
