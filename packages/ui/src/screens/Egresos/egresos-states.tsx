/**
 * Skeleton + error-banner + total-card sub-components extracted out of
 * EgresosScreen to respect the 200-line file budget (CLAUDE.md §4.4).
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { Money } from '@cachink/domain';
import { formatMoney } from '@cachink/domain';
import { Btn, Card } from '../../components/index';
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
    <Card testID="egresos-error" padding="md" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={18}
        color={colors.red}
      >
        {title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
        marginTop={6}
        marginBottom={12}
      >
        {body}
      </Text>
      <Btn variant="danger" onPress={onRetry} testID="egresos-retry">
        {retryLabel}
      </Btn>
    </Card>
  );
}

export function SkeletonRow({ index }: { index: number }): ReactElement {
  return (
    <Card testID={`egresos-skeleton-${index}`} padding="md" fullWidth>
      <View height={16} backgroundColor={colors.gray100} borderRadius={4} />
      <View
        height={16}
        backgroundColor={colors.gray100}
        borderRadius={4}
        marginTop={8}
        width="60%"
      />
    </Card>
  );
}
