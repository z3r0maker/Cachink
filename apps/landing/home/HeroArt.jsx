import { BrowserMock } from './BrowserMock.jsx';
import { Don } from './Don.jsx';
import { PhoneMock } from './PhoneMock.jsx';
import { Icon, sealPath } from './icons.jsx';

function Stamp({ size }) {
  const d = sealPath(size, 9);
  return (
    <div className="hero-stamp a-stamp" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true">
        <path d={d} fill="var(--yellow)" transform="translate(9 9)" />
        <path d={d} fill="var(--black)" transform="translate(4 4)" />
      </svg>
      <div className="hero-stamp-txt">
        <span className="wm">¡Xangarro!</span>
        <span>Sonó otra venta</span>
      </div>
    </div>
  );
}

const LABEL =
  'El portal de Xangarro muestra la utilidad del mes mientras la caja, en un teléfono, cobra una venta de $85.00 que llega sola al portal. Don Cuentas saluda: yo te cuido los números mientras tú atiendes.';

/** The hero composite: portal in a browser, the caja on a phone, the sale flying across. */
export function HeroArt() {
  return (
    <>
      <div className="hero-art hero-art-d" role="img" aria-label={LABEL}>
        <div className="hero-stage" />
        <BrowserMock />
        <PhoneMock />
        <div className="hero-toast a-fly num" style={{ opacity: 0 }}>
          <Icon name="check" size={15} />
          +$85.00
        </div>
        <Stamp size={160} />
        <div className="hero-don">
          <Don pose="hola" size={200} eager />
        </div>
        <p className="don-dice hero-dice">
          ¡Quiúbole! Yo te cuido los números mientras tú atiendes.
        </p>
        <div className="hero-label">
          <Icon name="sync" size={15} />
          Cada venta llega sola al portal
        </div>
      </div>
      <div className="hero-art hero-art-m" role="img" aria-label={LABEL}>
        <div className="hero-stage" />
        <BrowserMock compact />
        <PhoneMock compact />
        <div className="hero-toast a-fly num" style={{ opacity: 0 }}>
          +$85.00
        </div>
        <Stamp size={116} />
        <div className="hero-don">
          <Don pose="hola" size={130} eager />
        </div>
      </div>
    </>
  );
}
