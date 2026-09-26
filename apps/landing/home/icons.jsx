/**
 * Icons and brand marks for the home page. Lucide idiom: 24×24, stroke-only,
 * currentColor; the stroke width comes from the .ico class (2.3).
 */
export const PATHS = {
  check: 'M20 6L9 17l-5-5',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  sync: 'M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5',
  monitor: 'M2 4h20v13H2zM8 21h8M12 17v4',
  caja: 'M3 3h18v12H3zM3 19h18M7 7h4M7 11h10',
  phone: 'M6 2h12v20H6zM11 18h2',
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  ledger: 'M4 4h16v16H4zM4 10h16M10 4v16',
  box: 'M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8',
  doc: 'M7 3h8l4 4v14H7zM11 12h5M11 16h5',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  team: 'M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M17 11a3 3 0 1 0 0-6M22 21c0-3-2-5-5-5.5',
  fiado: 'M4 7h16v12H4zM4 11h16M8 15h3',
  wifi: 'M12 20h.01M2 8.8a15 15 0 0 1 20 0M5 12.9a10 10 0 0 1 14 0M8.5 16.4a5 5 0 0 1 7 0',
  wifiOff:
    'M12 20h.01M8.5 16.4a5 5 0 0 1 7 0M2 8.8a15 15 0 0 1 4.2-2.6M5 12.9a10 10 0 0 1 5.2-2.8M22 8.8a15 15 0 0 0-11.3-3.8M19 12.9a10 10 0 0 0-2.3-1.7M2 2l20 20',
  cuadra: 'M3 6h18v12H3zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM7 12h.01M17 12h.01',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4',
  download: 'M12 3v12M7 10l5 5 5-5M4 21h16',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  flame:
    'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  sandwich:
    'M3 11v3a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-3M12 19H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-3.8M3 11l7.8-6a2 2 0 0 1 2.4 0L21 11z',
  cup: 'M6 8l1.75 12.28a2 2 0 0 0 2 1.72h4.54a2 2 0 0 0 2-1.72L18 8M5 8h14M7 15a6.5 6.5 0 0 1 5 0 6.5 6.5 0 0 0 5 0M12 8l1-6h2',
  pizza:
    'M15 11h.01M11 15h.01M16 16h.01M2 16l20 6-6-20A20 20 0 0 0 2 16M5.7 17.1a17 17 0 0 1 11.4-11.4',
  bottle:
    'M8 2h8M9 2v2.8a4 4 0 0 1-.67 2.2l-.66 1A4 4 0 0 0 7 10.2V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.8a4 4 0 0 0-.67-2.2l-.66-1A4 4 0 0 1 15 4.8V2M7 15a6.5 6.5 0 0 1 5 0 6.5 6.5 0 0 0 5 0',
  utensils:
    'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7',
};

export function Icon({ name, size, className = 'ico' }) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The brand coin with its X. `size` is the coin's diameter in px. */
/**
 * The brush-stroke X of the brand mark (X-07), in the master's own
 * coordinates (assets/brand/icons/mark-flat.svg), boxed tight around it.
 */
export const MARK_X =
  'M287 352 L414 331 L503 437 L597 310 L697 291 L576 508 L735 675 L584 693 L503 586 L432 701 L315 711 L436 513 Z';
export const MARK_BOX = '281 271 460 460';

export function Coin({ size = 40, className = '', style }) {
  const x = Math.round(size * 0.6);
  return (
    <span
      className={`coin ${className}`}
      style={{ width: size, height: size, ...style }}
      aria-hidden="true"
    >
      <svg viewBox={MARK_BOX} width={x} height={x}>
        <path d={MARK_X} fill="currentColor" />
      </svg>
    </span>
  );
}

/** Don Cuentas' face: glasses and mustache, drawn in currentColor. */
export function DonCuentasFace({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <circle cx="8.3" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15.7" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11.1 10h1.8" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="8.3" cy="10.2" r="0.9" fill="currentColor" />
      <circle cx="15.7" cy="10.2" r="0.9" fill="currentColor" />
      <path
        d="M6 16.2c2-2.2 4-2.2 6-.3 2-1.9 4-1.9 6 .3-2 2.2-4.2 1.8-6 .4-1.8 1.4-4 1.8-6-.4z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Don Cuentas' avatar: the yellow coin wearing his face. */
export function DonCuentas({ size = 38, className = '' }) {
  return (
    <span
      className={`dc-avatar ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <DonCuentasFace size={Math.round(size * 0.66)} />
    </span>
  );
}

/** A 12-point stamp outline, centred in a box of `size` px (from the design's sealPath). */
export function sealPath(size, pad) {
  const R = size / 2 - pad;
  const r = R * 0.86;
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 12;
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(R + rad * Math.cos(a)).toFixed(1)} ${(R + rad * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
}
