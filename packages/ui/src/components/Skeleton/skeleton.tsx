/**
 * `<Skeleton>` — neutral placeholder primitive.
 *
 * Closes audit finding 6.4: every list screen reimplemented the same
 * "two grey bars inside a Card" placeholder pattern inline. This
 * primitive consolidates the shape so loading states stay consistent
 * across screens.
 *
 * Two render shapes shipped:
 *
 *   - `<Skeleton.Row testID="…" />` — the canonical "two stacked grey
 *     bars" used by Ventas / Egresos / Inventario list rows. Wrapped
 *     in a `<Card>` so the row matches the surrounding list visual.
 *   - `<Skeleton.Bar width={…} height={…} />` — a single neutral bar
 *     for finer-grained shimmer UIs (KPI strips, header titles, etc).
 *
 * No animation is applied — the brand is intentionally static
 * (CLAUDE.md §8.3 "no soft shadows / no animations that fight the
 * neobrutalist tactile feel"). The user perceives a quick swap from
 * grey-bar placeholder → real content, which mirrors the press
 * transform's snap-feel.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Card } from '../Card/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';

export interface SkeletonBarProps {
  /** Bar height. Defaults to 16. */
  readonly height?: number;
  /**
   * Bar width. Accepts a number (px) or a string (`'60%'`). Defaults to
   * `'100%'`.
   */
  readonly width?: number | string;
  readonly testID?: string;
}

/**
 * A single grey bar. Use directly when you need finer-grained
 * placeholders (one bar per row, KPI strip, …) than `<Skeleton.Row>`.
 */
function SkeletonBar(props: SkeletonBarProps): ReactElement {
  return (
    <View
      testID={props.testID}
      height={props.height ?? 16}
      width={props.width ?? '100%'}
      backgroundColor={colors.gray100}
      borderRadius={4}
    />
  );
}

export interface SkeletonRowProps {
  /**
   * Row index — used to derive a unique testID
   * (`{prefix}-skeleton-{index}`). The prefix defaults to
   * `'skeleton'` but most call sites pass their screen-scoped name
   * (`'ventas-skeleton'`) so the existing E2E selectors keep working
   * after the migration.
   */
  readonly index: number;
  /** Override the testID prefix. Defaults to `'skeleton'`. */
  readonly testIDPrefix?: string;
}

/**
 * The canonical list-row placeholder: a `<Card>` containing two grey
 * bars (full-width + 60%-width) — same shape every list screen used
 * to inline.
 *
 * Audit Round 2 G1: announces as a polite `role="status"` region with
 * `aria-busy="true"` and an i18n'd `aria-label` (`common.loading` →
 * "Cargando…"). Screen readers hear one "Cargando…" announcement per
 * row instead of treating the grey bars as decorative chrome. The
 * a11y attributes live on a wrapping `<View>` so the underlying
 * `<Card>` primitive's API stays untouched.
 */
function SkeletonRow(props: SkeletonRowProps): ReactElement {
  const prefix = props.testIDPrefix ?? 'skeleton';
  const { t } = useTranslation();
  return (
    <View role="status" aria-busy={true} aria-label={t('common.loading')}>
      <Card testID={`${prefix}-${props.index}`} padding="md" fullWidth>
        <SkeletonBar />
        <View marginTop={8}>
          <SkeletonBar width="60%" />
        </View>
      </Card>
    </View>
  );
}

/**
 * Compound primitive — `<Skeleton.Row>` for list rows,
 * `<Skeleton.Bar>` for finer-grained shimmer.
 */
export const Skeleton = {
  Row: SkeletonRow,
  Bar: SkeletonBar,
} as const;

// Re-export the component types so consumers can land them without
// peeking inside the namespace object.
export type { SkeletonRowProps as SkeletonRowComponentProps };
