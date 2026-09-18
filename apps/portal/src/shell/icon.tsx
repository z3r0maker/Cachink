import { brand } from '@xangarro/tokens';

/**
 * Lucide-idiom inline SVG.
 *
 * Stroke-width 2.2–2.4 rather than Lucide's default 2, so the glyphs read as
 * chunky as the 2 px borders around them. Colour is always inherited through
 * `currentColor`; never set a fill.
 */
export interface IconProps {
  readonly path: string;
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly title?: string;
}

export function Icon({ path, size = 20, strokeWidth = 2.2, title }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flex: 'none' }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d={path} />
    </svg>
  );
}

/**
 * The brand coin: a yellow disc with a 2.5 px black border, a hard shadow and a
 * black X at stroke-width 4.6 sized to 60% of the coin. Reproduced in code so
 * it stays crisp at any size — there is no raster asset.
 */
export function Coin({ size = brand.coinSidebar }: { readonly size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: 'none',
        borderRadius: 9999,
        background: 'var(--yellow)',
        border: '2.5px solid var(--black)',
        boxShadow: '3px 3px 0 var(--black)',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <svg
        viewBox="0 0 24 24"
        width="60%"
        height="60%"
        fill="none"
        stroke="var(--black)"
        strokeWidth={brand.coinStrokeWidth}
        strokeLinecap="butt"
        aria-hidden="true"
      >
        <path d="M5 5l14 14M19 5 5 19" />
      </svg>
    </span>
  );
}
