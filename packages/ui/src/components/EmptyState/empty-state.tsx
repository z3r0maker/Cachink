/**
 * EmptyState — the Cachink "there's nothing here yet" primitive.
 *
 * Rendered inside list views (Ventas, Egresos, Movimientos, Cuentas por
 * Cobrar, Inventario) when the list is empty OR when a search yields no
 * results. Composes an emoji, a bold title, an optional muted description,
 * and an optional action slot (typically a primary `<Btn>` CTA).
 *
 * Pure composition — no platform APIs involved — so no `.native.tsx` /
 * `.web.tsx` split is needed (CLAUDE.md §5.3 justified-split test: there's
 * no platform-specific capability involved). Identical rendering on mobile
 * and desktop.
 *
 * All visual values come from `../../theme` — no inline hex codes, no
 * invented sizes. Transparent background by design: this is content, and
 * the parent view owns the surface. Wrap in `<Card>` later (P1A-M2-T07) if
 * a hard-bordered variant is needed.
 */
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { colors, typography } from '../../theme';

export interface EmptyStateProps {
  /** Bold headline — short, imperative when possible ("Sin ventas todavía"). */
  readonly title: string;
  /** Optional 1–2-sentence description in muted gray text. */
  readonly description?: string;
  /** Optional emoji rendered above the title (e.g. 📭, 🛒, 📦). */
  readonly emoji?: string;
  /** Optional CTA slot — `<Btn>`, a link, or a stack of both. */
  readonly action?: ReactNode;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

function Emoji({ glyph }: { glyph: string }): ReactElement {
  return (
    <Text testID="empty-state-emoji" fontSize={56} marginBottom={16}>
      {glyph}
    </Text>
  );
}

function Title({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="empty-state-title"
      color={colors.black}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.black}
      fontSize={20}
      letterSpacing={typography.letterSpacing.tight}
      textAlign="center"
      marginBottom={6}
    >
      {text}
    </Text>
  );
}

function Description({ text }: { text: string }): ReactElement {
  return (
    <Text
      testID="empty-state-description"
      color={colors.gray400}
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.medium}
      fontSize={14}
      lineHeight={20}
      textAlign="center"
      maxWidth={320}
      marginBottom={20}
    >
      {text}
    </Text>
  );
}

/**
 * Renders the canonical Cachink empty-state block. See
 * `empty-state.stories.tsx` for the full variant catalog.
 */
export function EmptyState(props: EmptyStateProps): ReactElement {
  return (
    <View
      testID={props.testID ?? 'empty-state'}
      alignItems="center"
      paddingVertical={48}
      paddingHorizontal={24}
    >
      {props.emoji !== undefined && <Emoji glyph={props.emoji} />}
      <Title text={props.title} />
      {props.description !== undefined && <Description text={props.description} />}
      {props.action !== undefined && (
        <View marginTop={4} alignItems="center">
          {props.action}
        </View>
      )}
    </View>
  );
}
