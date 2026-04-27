/**
 * Egresos-screen-scoped sub-components: TotalCard (red − amount),
 * ErrorBanner (delegates to `<ErrorState>`), SkeletonRow (delegates
 * to `<Skeleton.Row>`). Extracted out of EgresosScreen to respect the
 * 200-line file budget (CLAUDE.md §4.4).
 *
 * Audit M-1 PR 5 (audit 6.4 + 6.5): the inline ErrorBanner and
 * SkeletonRow shapes are now thin wrappers over the brand
 * `<ErrorState>` and `<Skeleton.Row>` primitives. The screen-scoped
 * testIDs (`egresos-skeleton-{index}`, `egresos-error`,
 * `egresos-retry`) are preserved so existing E2E selectors keep
 * working.
 */

import type { ReactElement } from 'react';
import { Text } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Card, ErrorState, Skeleton } from '../../components/index';
import { colors, typography } from '../../theme';

export function TotalCard({ label, total }: { label: string; total: Money }): ReactElement {
  return (
    <Card testID="egresos-total-card" variant="white" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        letterSpacing={typography.letterSpacing.wide}
        color={colors.gray600}
        style={{ textTransform: 'uppercase' }}
      >
        {label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={32}
        color={colors.red}
        letterSpacing={typography.letterSpacing.tighter}
      >
        −{formatMoney(total)}
      </Text>
    </Card>
  );
}

export function ErrorBanner({
  title,
  body,
  retryLabel,
  onRetry,
}: {
  title: string;
  body: string;
  retryLabel: string;
  onRetry: () => void;
}): ReactElement {
  return (
    <ErrorState
      title={title}
      body={body}
      retryLabel={retryLabel}
      onRetry={onRetry}
      testID="egresos-error"
      retryTestID="egresos-retry"
    />
  );
}

export function SkeletonRow({ index }: { index: number }): ReactElement {
  return <Skeleton.Row index={index} testIDPrefix="egresos-skeleton" />;
}
