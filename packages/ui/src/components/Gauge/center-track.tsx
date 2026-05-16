/**
 * CenterTrack — bi-directional gauge fill for the center-origin mode.
 *
 * Positive values fill rightward from center (green). Negative values
 * fill leftward from center (red). A thin vertical divider marks the
 * zero point at the 50% position.
 *
 * Extracted from Gauge to stay under the 200-line limit.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { colors, radii } from '../../theme';
import type { GaugeTone, GaugeZone } from './gauge';

const GAUGE_RADIUS = radii[0]; // 8
const TRACK_HEIGHT = 14;
const DIVIDER_WIDTH = 2;

const TONE_FILL: Record<GaugeTone, string> = {
  neutral: colors.yellow,
  positive: colors.green,
  warning: colors.warning,
  negative: colors.red,
};

export interface CenterTrackProps {
  /** Clamped value in [-max, max]. */
  readonly clamped: number;
  readonly max: number;
  readonly tone: GaugeTone;
  readonly formattedValue: string;
  readonly ariaLabel: string;
  /** Optional zones rendered on the positive (right) half of the track. */
  readonly zones?: readonly GaugeZone[];
}

/** Render zone segments on the positive half (right side) of center track. */
function CenterZones(p: { zones: readonly GaugeZone[]; max: number }): ReactElement {
  return (
    <>
      {p.zones.map((z) => {
        // Map zone [from, to] in 0–max to the right half (50%–100%)
        const left = p.max === 0 ? 50 : 50 + (z.from / p.max) * 50;
        const width = p.max === 0 ? 0 : ((z.to - z.from) / p.max) * 50;
        return (
          <View
            key={`${z.from}-${z.to}`}
            testID="gauge-zone"
            position="absolute"
            top={0}
            left={`${left.toFixed(2)}%`}
            width={`${width.toFixed(2)}%`}
            height="100%"
            backgroundColor={z.color}
          />
        );
      })}
    </>
  );
}

export function CenterTrack(props: CenterTrackProps): ReactElement {
  const { clamped, max, tone, formattedValue, ariaLabel, zones } = props;
  const isNegative = clamped < 0;
  const ratio = max === 0 ? 0 : Math.abs(clamped) / max;
  const fillWidthPct = (ratio * 50).toFixed(2);

  return (
    <View
      testID="gauge-track"
      role="meter"
      aria-valuenow={clamped}
      aria-valuemin={-max}
      aria-valuemax={max}
      aria-valuetext={formattedValue}
      aria-label={ariaLabel}
      height={TRACK_HEIGHT}
      backgroundColor={colors.gray100}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={GAUGE_RADIUS}
      overflow="hidden"
      position="relative"
    >
      {/* Zone overlays on positive half */}
      {zones !== undefined && zones.length > 0 && (
        <CenterZones zones={zones} max={max} />
      )}
      {/* Fill bar — extends from center in the appropriate direction */}
      <View
        testID="gauge-fill"
        position="absolute"
        top={0}
        height="100%"
        width={`${fillWidthPct}%`}
        backgroundColor={TONE_FILL[tone]}
        {...(isNegative
          ? { right: '50%' }
          : { left: '50%' })}
      />
      {/* Center divider — always visible at the 50% mark */}
      <View
        testID="gauge-center-divider"
        position="absolute"
        top={0}
        left="50%"
        marginLeft={-DIVIDER_WIDTH / 2}
        width={DIVIDER_WIDTH}
        height="100%"
        backgroundColor={colors.gray400}
      />
    </View>
  );
}
