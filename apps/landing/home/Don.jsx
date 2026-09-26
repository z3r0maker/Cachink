/**
 * Don Cuentas, full body, the same poses the portal uses (ADR-107). One pose
 * per section: `hola` greets in the hero, `quieto` listens (and blinks),
 * `senalando` points at what is new and at the prices, `ayuda` sits by the
 * questions, `caminando` walks through how it works, `celebrando` cheers the
 * sign-up. Every motion stops under prefers-reduced-motion (don.css).
 */
const MOTION = {
  hola: 'saluda',
  quieto: 'respira',
  senalando: 'respira',
  ayuda: 'respira',
  caminando: 'camina',
  celebrando: 'salta',
};

/** Decorative by default: his words always travel as text beside him. */
export function Don({ pose, size = 160, alt = '', eager = false, className = '' }) {
  const src = `/assets/don/${pose}.webp`;
  const img = { width: size, height: size, loading: eager ? 'eager' : 'lazy', decoding: 'async' };
  return (
    <span
      className={`don don-${MOTION[pose]} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden={alt ? undefined : 'true'}
    >
      <img className="don-img" src={src} alt={alt} {...img} />
      {pose === 'quieto' ? (
        <img className="don-img don-blink" src="/assets/don/quieto-parpadeo.webp" alt="" {...img} />
      ) : null}
    </span>
  );
}
