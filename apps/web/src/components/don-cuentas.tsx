import { avatar } from './don-cuentas.css';

/**
 * The advisor's customer-facing name. The code, the route (`/asesor`), the
 * `notices.source` value and the `capabilities.asesor` key keep the old
 * identifier on purpose: only what a person reads is renamed.
 */
export const DON_CUENTAS = 'Don Cuentas';

export type DonCuentasSize = 'sm' | 'md' | 'lg';

const GLYPH: Record<DonCuentasSize, number> = { sm: 14, md: 26, lg: 38 };

/**
 * Don Cuentas' avatar. Decorative: his name always travels as text next to
 * it, so the face is hidden from assistive technology.
 */
export function DonCuentasAvatar({ size = 'md' }: { readonly size?: DonCuentasSize }) {
  const px = GLYPH[size];
  return (
    <span className={avatar({ size })} aria-hidden="true">
      <svg viewBox="0 0 24 24" width={px} height={px}>
        <circle cx="8.3" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth={1.6} />
        <circle cx="15.7" cy="10" r="2.8" fill="none" stroke="currentColor" strokeWidth={1.6} />
        <path d="M11.1 10h1.8" stroke="currentColor" strokeWidth={1.6} />
        <circle cx="8.3" cy="10.2" r="0.9" fill="currentColor" />
        <circle cx="15.7" cy="10.2" r="0.9" fill="currentColor" />
        <path
          d="M6 16.2c2-2.2 4-2.2 6-.3 2-1.9 4-1.9 6 .3-2 2.2-4.2 1.8-6 .4-1.8 1.4-4 1.8-6-.4z"
          fill="currentColor"
        />
      </svg>
    </span>
  );
}
