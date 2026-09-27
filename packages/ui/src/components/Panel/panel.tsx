/**
 * The two surfaces of El Mostrador (docs/design/el-mostrador.md §1):
 *
 * - `QuietPanel`: everything sits on one. White, the quiet gray edge,
 *   radius 20, no shadow; an optional eyebrow head (label · count · note ·
 *   action) like the caja's `Panel` (`operador/ui/panel.tsx`).
 * - `HeroPanel`: the one thing the screen is about. Thick black edge and the
 *   hero shadow; yellow by default (Mi turno's «Efectivo que debe haber»),
 *   white when the screen's hero is a form. **Once per screen, never nested.**
 *
 * `Eyebrow` is the 12 px, 800, 0.12em uppercase label both use.
 */
import type { ReactElement, ReactNode } from 'react';
import { View } from '@tamagui/core';
import { borderColors, borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { MText } from '../Mostrador/mtext';

/** 0.12em at 12 px — the boards' eyebrow tracking. */
const EYEBROW_TRACKING = 1.44;

export function Eyebrow(props: {
  readonly children: string;
  /** `textMuted` on white; pass `gray600` on the gray200 page (§7). */
  readonly color?: string;
  readonly testID?: string;
}): ReactElement {
  return (
    <MText
      testID={props.testID}
      size="xs"
      weight="extraBold"
      letterSpacing={EYEBROW_TRACKING}
      color={props.color ?? colors.textMuted}
      style={{ textTransform: 'uppercase' }}
    >
      {props.children}
    </MText>
  );
}

export interface QuietPanelProps {
  /** The eyebrow, also the section's accessible name. */
  readonly label?: string;
  readonly count?: number;
  readonly note?: string;
  readonly action?: ReactNode;
  /** Rows usually run edge to edge; pass a padding for loose content. */
  readonly padding?: number;
  readonly children: ReactNode;
  readonly testID?: string;
}

function Count({ n }: { n: number }): ReactElement {
  return (
    <View backgroundColor={colors.gray100} borderRadius={shapeRadii.pill} paddingHorizontal={8}>
      <MText size="xs" weight="extraBold">
        {n}
      </MText>
    </View>
  );
}

function PanelHead(p: QuietPanelProps & { readonly label: string }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={8}
      paddingHorizontal={16}
      paddingTop={14}
      paddingBottom={8}
    >
      <Eyebrow>{p.label}</Eyebrow>
      {p.count === undefined ? null : <Count n={p.count} />}
      <View flex={1} minWidth={0}>
        {p.note ? (
          <MText size="xs" weight="semibold" color={colors.textMuted} numberOfLines={1}>
            {p.note}
          </MText>
        ) : null}
      </View>
      {p.action}
    </View>
  );
}

export function QuietPanel(props: QuietPanelProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'quiet-panel'}
      role="region"
      aria-label={props.label}
      backgroundColor={colors.white}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      borderRadius={radii[6]}
      overflow="hidden"
    >
      {props.label === undefined ? null : <PanelHead {...props} label={props.label} />}
      {props.padding === undefined ? (
        props.children
      ) : (
        <View padding={props.padding} paddingTop={props.label === undefined ? props.padding : 0}>
          {props.children}
        </View>
      )}
    </View>
  );
}

export interface HeroPanelProps {
  readonly tone?: 'yellow' | 'white';
  /** What the hero is, for screen readers. */
  readonly label: string;
  readonly children: ReactNode;
  readonly testID?: string;
}

export function HeroPanel(props: HeroPanelProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'hero-panel'}
      role="region"
      aria-label={props.label}
      backgroundColor={props.tone === 'white' ? colors.white : colors.yellow}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      borderRadius={radii[7]}
      paddingHorizontal={18}
      paddingVertical={16}
      style={{ boxShadow: shadows.hero }}
    >
      {props.children}
    </View>
  );
}
