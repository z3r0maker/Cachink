/** Lucide-shaped stroke icons for Mi negocio's Plan y pagos and Sincronización. */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function IconoCheck({
  size = 16,
  grosor = 3,
}: {
  readonly size?: number;
  readonly grosor?: number;
}) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={grosor}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconoGuion({ size = 16 }: { readonly size?: number }) {
  return (
    <svg {...base} width={size} height={size} strokeWidth={2.6}>
      <path d="M6 12h12" />
    </svg>
  );
}

export function IconoCalendario() {
  return (
    <svg {...base} width={16} height={16} strokeWidth={2.3}>
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconoEstrella() {
  return (
    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" aria-hidden>
      <path d="M12 2l2.9 6.9L22 9.3l-5.5 4.8L18.2 21 12 17.3 5.8 21l1.7-6.9L2 9.3l7.1-.4z" />
    </svg>
  );
}

export function IconoAlerta() {
  return (
    <svg {...base} width={16} height={16} strokeWidth={2.4}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  );
}
