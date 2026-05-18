/**
 * Icon — desktop / web (Tauri) + Storybook + Vitest variant.
 *
 * Vite-based tools resolve this file via the default import chain
 * `./icon.tsx -> ./icon.web.tsx`. Metro ignores it and picks
 * `./icon.native.tsx` on mobile.
 *
 * The icon map lives in `./icon-map.web.ts` to keep this file
 * under 200 lines. Adding a new `IconName` requires entries in both
 * `icon-map.web.ts` and `icon-map.native.ts`.
 */
import type { ReactElement } from 'react';
import type { IconProps } from './icon.shared';
import { ICON_DEFAULT_SIZE, ICON_DEFAULT_STROKE } from './icon.shared';
import { ICONS } from './icon-map.web';

export type IconElement = ReactElement;

export function Icon(props: IconProps): IconElement {
  const Glyph = ICONS[props.name];
  const size = props.size ?? ICON_DEFAULT_SIZE;
  const strokeWidth = props.strokeWidth ?? ICON_DEFAULT_STROKE;
  const color = props.color ?? 'currentColor';
  const decorative = props.ariaLabel === undefined;

  return (
    <Glyph
      data-testid={props.testID ?? `icon-${props.name}`}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      aria-hidden={decorative ? 'true' : undefined}
      aria-label={decorative ? undefined : props.ariaLabel}
      role={decorative ? undefined : 'img'}
    />
  );
}
