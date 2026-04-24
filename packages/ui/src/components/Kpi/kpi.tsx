/**
 * Kpi — the Cachink "hero big number" primitive.
 *
 * The §8.4 KPI display voice: weight 900, tight letter-spacing, tabular
 * numerals, with a §8.2 uppercase label above and an optional muted hint
 * below. Composes inside a `<Card>` (Director Home, Indicadores). Kpi
 * itself renders only the three text lines — surface, padding, and border
 * are the parent Card's responsibility, mirroring the SectionTitle ↔
 * parent-surface separation.
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * `value` is a `string`, not a `Money` or `number`. This keeps Kpi free of
 * domain imports and lets the same primitive render currency, percentages,
 * counts, or any other pre-formatted string. Currency formatting is the
 * `formatMoney(...)` formatter's responsibility (P1A-M3-T03).
 *
 * All visual values come from `../../theme` — no inline hex codes.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';

export type KpiTone = 'neutral' | 'positive' | 'negative';

export interface KpiProps {
  /** Section label — proper-cased; visual uppercase is a CSS transform. */
  readonly label: string;
  /** Pre-formatted value string (e.g. "$8,450.00", "42", "+12%"). */
  readonly value: string;
  /** Optional sub-line ("vs. ayer +12%"), rendered in muted gray. */
  readonly hint?: string;
  /** Tone token. Defaults to `neutral` (black value). */
  readonly tone?: KpiTone;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

const TONE_COLOR: Record<KpiTone, string> = {
  neutral: colors.black,
  positive: colors.green,
  negative: colors.red,
};

function Label({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="kpi-label"
      color={colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={11}
      letterSpacing={typography.letterSpacing.wide}
      style={{ textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

function Value({ text, color }: { text: string; color: string }): ReactElement {
  return (
    <Text
      testID="kpi-value"
      color={color}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={36}
      letterSpacing={typography.letterSpacing.tightest}
      marginTop={6}
      style={{ fontVariant: ['tabular-nums'] }}
    >
      {text}
    </Text>
  );
}

function Hint({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="kpi-hint"
      color={colors.gray400}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={13}
      marginTop={4}
    >
      {text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink KPI block. See `kpi.stories.tsx` for the
 * full variant catalog.
 */
export function Kpi(props: KpiProps): ReactElement {
  const tone = props.tone ?? 'neutral';
  return (
    <View testID={props.testID ?? 'kpi'} flexDirection="column">
      <Label text={props.label} />
      <Value text={props.value} color={TONE_COLOR[tone]} />
      {props.hint !== undefined && <Hint text={props.hint} />}
    </View>
  );
}
