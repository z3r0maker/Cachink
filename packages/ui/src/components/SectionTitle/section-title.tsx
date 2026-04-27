/**
 * SectionTitle — the Cachink section eyebrow.
 *
 * The typographic marker that announces any grouped block on a screen:
 * "VENTAS HOY", "ACTIVIDAD RECIENTE", "STOCK BAJO", "CUENTAS POR COBRAR".
 * Every Phase 1C screen renders one above every list/card group, so this
 * keeps a single source of truth for the §8.2 Labels voice (weight 700,
 * wide tracking, uppercase, gray600).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split (CLAUDE.md §5.3 justified-split test: no platform-
 * specific capability). Identical rendering on mobile and desktop.
 *
 * `action` is a `ReactNode` slot — typically a ghost `<Btn>` "Ver todo"
 * or a small "+ Nuevo" primary Btn — so SectionTitle stays decoupled from
 * `<Btn>`'s evolving API (same pattern as EmptyState.action).
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented sizes. Transparent background by design: this is content, and
 * the parent view owns the surface.
 */
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';

export interface SectionTitleProps {
  /**
   * Section label. Case is preserved in the DOM; visual uppercase is a
   * CSS transform so screen readers still hear the real casing.
   * Consumers embed counts directly ("Ventas hoy · 4") — no separate
   * prop for that today.
   */
  readonly title: string;
  /** Optional right-aligned CTA slot — `<Btn variant="ghost">Ver todo</Btn>`, a link, etc. */
  readonly action?: ReactNode;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

function Title({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="section-title-text"
      // Audit Round 2 G1: section eyebrows are semantically headings
      // — surface as `role="heading"` with `aria-level={2}` so screen
      // readers can build the document outline. h1 is reserved for the
      // screen title; section eyebrows are h2.
      role="heading"
      aria-level={2}
      color={colors.gray600}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.bold}
      fontSize={12}
      letterSpacing={typography.letterSpacing.wide}
      // Audit 9.3 — long Spanish section labels ("ACTIVIDAD RECIENTE",
      // "CUENTAS POR COBRAR") wrap awkwardly on phone widths when the
      // right `action` slot is also rendered. Cap to one line + ellipsis.
      numberOfLines={1}
      ellipsizeMode="tail"
      // Audit 9.4 — Dynamic Type / Android font scaling above 130 %
      // would push the eyebrow's height past the 12-pt rhythm and
      // misalign with the action slot. Cap at 1.3×.
      maxFontSizeMultiplier={1.3}
      style={{ textTransform: 'uppercase' }}
    >
      {text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink section eyebrow. See
 * `section-title.stories.tsx` for the full variant catalog.
 */
export function SectionTitle(props: SectionTitleProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'section-title'}
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      marginBottom={12}
    >
      <Title text={props.title} />
      {props.action !== undefined && (
        <View testID="section-title-action" alignItems="center">
          {props.action}
        </View>
      )}
    </View>
  );
}
