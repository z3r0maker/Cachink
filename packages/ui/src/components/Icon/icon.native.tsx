/**
 * Icon — React Native (Metro) variant.
 *
 * Metro auto-resolves this file when the mobile bundle imports
 * `./icon` (or anything that lands at `./icon.tsx` first). The web
 * default re-export in `./icon.tsx` never runs on RN because Metro
 * stops at `.native.tsx`.
 *
 * The icon map lives in `./icon-map.native.ts` to keep this file
 * under 200 lines. Adding a new `IconName` requires entries in both
 * `icon-map.native.ts` and `icon-map.web.ts`.
 */
import type { ReactElement } from 'react';
import type { IconProps } from './icon.shared';
import { ICON_DEFAULT_SIZE, ICON_DEFAULT_STROKE } from './icon.shared';
import { ICONS } from './icon-map.native';

export type IconElement = ReactElement;

export function Icon(props: IconProps): IconElement {
  const Glyph = ICONS[props.name];
  const size = props.size ?? ICON_DEFAULT_SIZE;
  const strokeWidth = props.strokeWidth ?? ICON_DEFAULT_STROKE;
  const color = props.color ?? 'currentColor';
  const decorative = props.ariaLabel === undefined;

  return (
    <Glyph
      testID={props.testID ?? `icon-${props.name}`}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      accessible={!decorative}
      accessibilityLabel={decorative ? undefined : props.ariaLabel}
      accessibilityRole={decorative ? undefined : 'image'}
    />
  );
}
