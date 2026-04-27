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
      // Audit 9.3 — long Spanish KPI labels ("CUENTAS POR COBRAR",
      // "MARGEN OPERATIVO") wrap on the narrow KPI columns at phone
      // widths. Cap to one line + ellipsis.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — KPI labels are visual chrome; Dynamic Type
      // scaling above 130 % would unbalance the value-line geometry.
      maxFontSizeMultiplier={1.3}
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
      // Audit 9.3 — KPI values like "$1,250,000.00" can exceed the
      // 36-pt scale on narrow KPI strips. Cap to one line + ellipsis
      // so the value never wraps and pushes the hint off the card.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — at the 36-pt size, 1.5× Dynamic Type would put
      // the value at >54 px and break the KPI strip. Cap at 1.3×
      // (~47 px) — still bigger than default for accessibility but
      // visually balanced.
      maxFontSizeMultiplier={1.3}
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
      // Audit 9.3 — hints like "vs. ayer +12%" or "5 productos bajo
      // umbral" are short but the KPI column is narrow. Cap to two
      // lines + ellipsis.
      numberOfLines={2}
      ellipsizeMode="tail"
      // Audit 9.4 — secondary text can scale a little more
      // generously than the value; cap at 1.5×.
      maxFontSizeMultiplier={1.5}
    >
      {text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink KPI block. See `kpi.stories.tsx` for the
 * full variant catalog.
 *
 * Audit Round 2 G1: the root `<View>` exposes a combined
 * `aria-label="${label}: ${value}"` (e.g. "Margen Operativo: $1,250,000.00")
 * so screen readers announce the KPI as a single semantic unit instead of
 * narrating the eyebrow, value, and hint as three disjoint Text nodes.
 * The hint is included when present so users hear the full context.
 */
export function Kpi(props: KpiProps): ReactElement {
  const tone = props.tone ?? 'neutral';
  const ariaLabel =
    props.hint !== undefined
      ? `${props.label}: ${props.value} (${props.hint})`
      : `${props.label}: ${props.value}`;
  return (
    <View testID={props.testID ?? 'kpi'} flexDirection="column" aria-label={ariaLabel}>
      <Label text={props.label} />
      <Value text={props.value} color={TONE_COLOR[tone]} />
      {props.hint !== undefined && <Hint text={props.hint} />}
    </View>
  );
}
