/**
 * Gauge — the Cachink horizontal progress meter primitive.
 *
 * A slim, hard-bordered, hard-shadowless horizontal bar used on the
 * Indicadores screen for margins, liquidity, rotation, and any other 0..max
 * metric. Picked over a circular SVG ring (which would pull `react-native-
 * svg` as a runtime dep) for zero readability gain on a small mobile
 * surface — see plan rationale.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * `value` is clamped to `[0, max]` defensively so callers passing raw
 * computed numbers (a margin that briefly exceeds 100, a liquidity ratio
 * during a refund) never blow the layout. `max === 0` short-circuits to a
 * 0% fill (prevents a divide-by-zero NaN width).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented radii.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';

export type GaugeTone = 'neutral' | 'positive' | 'warning' | 'negative';

export interface GaugeProps {
  /** Numeric value — clamped to [0, max] before rendering. */
  readonly value: number;
  /** Upper bound. Defaults to 100 (percentage semantics). */
  readonly max?: number;
  /** Optional label rendered above the bar (e.g. "Margen bruto"). */
  readonly label?: string;
  /** Tone token. Defaults to `neutral` (yellow fill). */
  readonly tone?: GaugeTone;
  /** Whether the formatted value is rendered to the right of the label. */
  readonly showValue?: boolean;
  /** Optional formatter — overrides the default `${value}%` / `${v}/${max}`. */
  readonly valueFormatter?: (value: number, max: number) => string;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

const TONE_FILL: Record<GaugeTone, string> = {
  neutral: colors.yellow,
  positive: colors.green,
  warning: colors.warning,
  negative: colors.red,
};

const GAUGE_RADIUS = radii[0]; // 8 — small pill-ish radius for the slim bar.
const TRACK_HEIGHT = 14;

function defaultFormat(value: number, max: number): string {
  return max === 100 ? `${value}%` : `${value}/${max}`;
}

function clampToRange(value: number, max: number): number {
  if (value < 0) return 0;
  if (value > max) return max;
  return value;
}

interface HeaderProps {
  readonly label: string | undefined;
  readonly showValue: boolean;
  readonly displayValue: string;
}

function Header(props: HeaderProps): ReactElement | null {
  if (props.label === undefined && !props.showValue) return null;
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center" marginBottom={6}>
      {props.label !== undefined && (
        <Text
          testID="gauge-label"
          color={colors.black}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={13}
        >
          {props.label}
        </Text>
      )}
      {props.showValue && (
        <Text
          testID="gauge-value"
          color={colors.gray600}
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={13}
        >
          {props.displayValue}
        </Text>
      )}
    </View>
  );
}

interface TrackProps {
  readonly clamped: number;
  readonly max: number;
  readonly fillPercent: `${string}%`;
  readonly tone: GaugeTone;
  readonly formattedValue: string;
  readonly ariaLabel: string;
}

/**
 * Audit Round 2 G1: announce as `role="meter"` with the canonical
 * ARIA value attributes. Screen readers read the gauge as
 * "[label] meter, [valuetext]" instead of treating the bar as
 * decorative chrome. Extracted from `<Gauge>` to keep the parent
 * function under the 40-line cap.
 */
function Track(props: TrackProps): ReactElement {
  return (
    <View
      testID="gauge-track"
      role="meter"
      aria-valuenow={props.clamped}
      aria-valuemin={0}
      aria-valuemax={props.max}
      aria-valuetext={props.formattedValue}
      aria-label={props.ariaLabel}
      height={TRACK_HEIGHT}
      backgroundColor={colors.gray100}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={GAUGE_RADIUS}
      overflow="hidden"
    >
      <View
        testID="gauge-fill"
        height="100%"
        width={props.fillPercent}
        backgroundColor={TONE_FILL[props.tone]}
      />
    </View>
  );
}

/**
 * Renders a horizontal-bar gauge. See `gauge.stories.tsx` for the full
 * variant catalog.
 */
export function Gauge(props: GaugeProps): ReactElement {
  const max = props.max ?? 100;
  const tone = props.tone ?? 'neutral';
  const showValue = props.showValue ?? true;
  const formatter = props.valueFormatter ?? defaultFormat;
  const clamped = clampToRange(props.value, max);
  const fillRatio = max === 0 ? 0 : clamped / max;
  const fillPercent = `${(fillRatio * 100).toFixed(2)}%` as const;
  const formattedValue = formatter(clamped, max);
  const ariaLabel =
    props.label !== undefined ? `${props.label}: ${formattedValue}` : formattedValue;

  return (
    <View testID={props.testID ?? 'gauge'} flexDirection="column">
      <Header label={props.label} showValue={showValue} displayValue={formattedValue} />
      <Track
        clamped={clamped}
        max={max}
        fillPercent={fillPercent}
        tone={tone}
        formattedValue={formattedValue}
        ariaLabel={ariaLabel}
      />
    </View>
  );
}
