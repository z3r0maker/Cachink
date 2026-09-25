import { DonCuentas, DonCuentasFace } from './icons.jsx';

const TIPS = [
  <>
    Pedro, la tortilla te subió <strong>12%</strong> este mes. La orden de 5 tacos ya te deja menos
    margen.
  </>,
  <>Registraste dos gastos de gas iguales el martes. ¿No será uno repetido?</>,
  <>El queso Oaxaca lleva 45 días sin moverse. ¿Le hacemos promo de quesadillas?</>,
];

function Tip({ n, children }) {
  return (
    <div className="dc-row">
      <span className={`c-av${n}`}>
        <DonCuentas size={38} />
      </span>
      <div className="dc-stack">
        <span className={`dc-typing c-tp${n}`} style={{ opacity: 0 }} aria-hidden="true">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
        </span>
        <div className={`dc-bubble c-ms${n}${n === 1 ? ' hi' : ''}`}>{children}</div>
      </div>
    </div>
  );
}

function Cierre() {
  return (
    <div className="dc-cierre c-ms4">
      <div className="dc-cierre-top">
        <strong>¡Tu cierre de agosto está listo!</strong>
        <span className="xtag dc-chip">
          <span
            className="dc-avatar"
            style={{ width: 22, height: 22, boxShadow: 'none' }}
            aria-hidden="true"
          >
            <DonCuentasFace size={15} />
          </span>
          Don Cuentas · con IA
        </span>
      </div>
      <p>
        Vendiste 18% más que en julio, pero la tortilla y el gas se comieron 3 puntos de margen.
        Sube la orden de 5 tacos a <strong className="num">$105.00</strong> y la gringa a{' '}
        <strong className="num">$70.00</strong> para recuperarlo.
      </p>
      <span className="dc-link">Ver revisión completa</span>
    </div>
  );
}

/** «Para ti · hoy»: three computed tips, then the AI month-end review. */
export function DonCuentasChat() {
  return (
    <div className="xcard dc-chat">
      <div className="dc-chat-head">
        <strong>Para ti · hoy</strong>
        <span>Calculado a partir de tus registros</span>
      </div>
      {TIPS.map((t, i) => (
        <Tip key={i} n={i + 1}>
          {t}
        </Tip>
      ))}
      <Cierre />
    </div>
  );
}
