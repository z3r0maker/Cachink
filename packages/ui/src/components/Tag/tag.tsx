/**
 * Tag — the Cachink pill/label primitive.
 *
 * A small classification chip used across the mock for `categoria`, `metodo`,
 * and other short status labels (see `VentaCard`, egresos list, inventario
 * categoria tag).
 *
 * **Decorative-only contract (ADR-043).** `<Tag>` is **never** a tap target.
 * It exposes no `onPress`, no `role="button"`, no focus ring. The audit's 3.10
 * worry that "the visual implies tappability" was reconnoitred and zero
 * tappable Tag instances exist in the codebase today. If a future surface
 * needs a tappable chip:
 *
 *   - For radio-group / segmented choices (e.g. period filters, sub-tabs)
 *     use `<SegmentedToggle>`. It already ships the 48-pt effective tap
 *     target, the brand press-transform, and `aria-selected` semantics.
 *   - For single-tappable chips that don't fit a segmented group, extend
 *     `<Btn>` with a future `chip` size variant rather than overloading
 *     `<Tag>`. A separate `<Chip>` primitive is **not** planned for Phase 1
 *     (see ADR-043 for the deferral rationale).
 *
 * The seven variants map to brand + semantic tokens from CLAUDE.md §8.1 so the
 * prop surface stays disciplined (no raw color props). Every variant ships the
 * same 2px hard border per CLAUDE.md §8.3, overriding the mock's 1.5px default.
 *
 * All visual values come from `../../theme` — no inline hex codes, no invented
 * radii. Label casing is preserved (no `textTransform`) — mock shows proper-
 * cased Spanish categoria strings like `Producto`, `Transferencia`.
 */
import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, radii, typography } from '../../theme';

export type TagVariant = 'neutral' | 'brand' | 'soft' | 'success' | 'info' | 'danger' | 'warning';

export interface TagProps {
  /** Pill content — a short proper-cased string (categoria, metodo, status). */
  readonly children: string;
  /** Semantic variant. Defaults to `neutral`. */
  readonly variant?: TagVariant;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

interface VariantStyle {
  readonly background: string;
  readonly color: string;
}

const VARIANTS: Record<TagVariant, VariantStyle> = {
  neutral: { background: colors.gray100, color: colors.black },
  brand: { background: colors.yellow, color: colors.black },
  soft: { background: colors.yellowSoft, color: colors.black },
  success: { background: colors.greenSoft, color: colors.black },
  info: { background: colors.blueSoft, color: colors.blue },
  danger: { background: colors.redSoft, color: colors.red },
  warning: { background: colors.warningSoft, color: colors.black },
};

/** Pill radius — 20 from the §8.3 scale, matches the mock's 20. */
const TAG_RADIUS = radii[6];

function TagText({ text, color }: { text: string; color: string }): ReactElement {
  return (
    <Text
      color={color}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={11}
      letterSpacing={typography.letterSpacing.wide}
      // Audit 9.3 — Tags are short by contract, but sit in tight
      // chip-row geometry (e.g. inside `<VentaCard>`). Cap to one
      // line + ellipsis so a stray long string never wraps the row.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — the chip-row geometry is built around the 11-pt
      // base size + 22-pt pill height. Cap at 1.2× so even at high
      // Dynamic Type the pill stays inside the row's vertical rhythm.
      maxFontSizeMultiplier={1.2}
    >
      {text}
    </Text>
  );
}

/**
 * Renders a Cachink-branded classification pill. See `tag.stories.tsx` for
 * the full variant matrix.
 */
export function Tag(props: TagProps): ReactElement {
  const variant = props.variant ?? 'neutral';
  const v = VARIANTS[variant];

  return (
    <View
      testID={props.testID ?? 'tag'}
      backgroundColor={v.background}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={TAG_RADIUS}
      paddingHorizontal={10}
      paddingVertical={3}
      alignSelf="flex-start"
      flexDirection="row"
    >
      <TagText text={props.children} color={v.color} />
    </View>
  );
}
