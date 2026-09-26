import { Don } from './Don.jsx';
import { Coin, sealPath } from './icons.jsx';

const SEAL = sealPath(300, 14);

export function SceneLibreta() {
  return (
    <div className="sc sc1 rs-libreta">
      <div className="up rs-title">¿Todavía llevas la caja en la libreta?</div>
      <div className="pop rs-note">
        <svg viewBox="0 0 340 400" preserveAspectRatio="none" aria-hidden="true">
          <path
            d="M0 70H340M0 120H340M0 170H340M0 220H340M0 270H340M0 320H340"
            stroke="var(--blue-soft)"
            strokeWidth="2"
          />
          <path d="M50 0V400" stroke="var(--red)" strokeWidth="2" />
          <path
            className="a-scribble"
            d="M70 58c20-10 40 8 60-2s30-8 50 0M70 108c30-6 50 10 90 0M70 158c14-8 30 6 44-2s24 4 40 0 30-6 44 2M70 208c40-8 60 8 110-2M70 258c24-4 40 6 60-2M70 300l180 40M250 300L70 340"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <span className="rs-wrong">¿$4,3?0?</span>
      </div>
    </div>
  );
}

export function SceneVenta() {
  return (
    <div className="sc sc2 rs-venta">
      <span className="pop rs-coin">
        <Coin size={190} />
      </span>
      <span className="up wm rs-wm">¡Xangarro!</span>
      <span className="up d1 xtag rs-sale">
        Sonó otra venta · <span className="num">+$85.00</span>
      </span>
    </div>
  );
}

export function SceneDonCuentas() {
  return (
    <div className="sc sc3 rs-dc">
      <span className="pop rs-avatar">
        <Don pose="senalando" size={240} />
      </span>
      <div className="rs-dc-col">
        <span className="up xeyebrow">Don Cuentas · tu contador de cabecera</span>
        <div className="up d1 rs-bubble">
          Cierre de agosto: la tortilla te subió 12%. Sube la orden de 5 tacos a $105 y recuperas tu
          margen.
        </div>
        <div className="up d2 rs-actions">
          <span className="xtag" style={{ background: 'var(--yellow)' }}>
            Ver revisión
          </span>
          <span className="xtag">Compartir con mi contador</span>
        </div>
      </div>
    </div>
  );
}

export function SceneMeta() {
  return (
    <div className="sc sc4 rs-meta">
      <div className="pop rs-seal">
        <svg viewBox="0 0 300 300" aria-hidden="true">
          <path d={SEAL} fill="var(--black)" transform="translate(14 14)" />
          <path
            d={SEAL}
            fill="var(--yellow)"
            stroke="var(--black)"
            strokeWidth="3"
            transform="translate(6 6)"
          />
        </svg>
        <div className="rs-seal-txt">
          <span>Meta lograda</span>
          <strong>Agosto</strong>
        </div>
      </div>
      <div className="rs-meta-col">
        <div className="up rs-title">Tu negocio, con números claros.</div>
        <span className="up d1 xbtn xbtn-dark rs-url">
          <Coin size={28} />
          xangarro.mx
        </span>
      </div>
    </div>
  );
}
