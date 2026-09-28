/**
 * PathIcon — draws one of the caja's line glyphs from its SVG path data.
 *
 * The web caja names its icons by path (`ICONS` in `@xangarro/caja`, the
 * design files' `ICON` table), so the phone draws the very same strings
 * instead of mapping them to a second icon set (ADR-118). Lucide geometry:
 * a 24 × 24 box, round caps and joins, no fill.
 *
 * `react-native-svg` renders on iOS, Android and (through react-native-web)
 * the web build; the unit tests mock it with plain elements.
 */
import type { ReactElement } from 'react';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

export interface PathIconProps {
  /** SVG path data in a 24 × 24 box, e.g. `ICONS.caja`. */
  readonly d: string;
  /** Rendered edge in px. Defaults to 22 (the tab bar's glyph). */
  readonly size?: number;
  readonly strokeWidth?: number;
  readonly color?: string;
  readonly testID?: string;
}

/** Decorative by design: the control that holds it carries the label. */
export function PathIcon(props: PathIconProps): ReactElement {
  const size = props.size ?? 22;
  return (
    <Svg
      testID={props.testID}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path
        d={props.d}
        stroke={props.color ?? colors.black}
        strokeWidth={props.strokeWidth ?? 2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}
