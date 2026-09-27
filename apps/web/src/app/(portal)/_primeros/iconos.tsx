/** Small lucide-shaped glyphs the first-day screens share. */
const TRAZO = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function IconoSubir({ size = 18 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={2.2} {...TRAZO}>
      <path d="M12 3v12M17 8l-5-5-5 5M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    </svg>
  );
}

export function IconoBajar({ size = 16 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={2.4} {...TRAZO}>
      <path d="M12 15V3M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5" />
    </svg>
  );
}

export function IconoCandado({ size = 18 }: { readonly size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      strokeWidth={2.2}
      {...TRAZO}
      style={{ flex: 'none' }}
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function IconoPalomita({
  size = 20,
  grosor = 2.6,
}: {
  readonly size?: number;
  readonly grosor?: number;
}) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={grosor} {...TRAZO}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export function IconoFlecha({ size = 18 }: { readonly size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} strokeWidth={2.4} {...TRAZO}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
