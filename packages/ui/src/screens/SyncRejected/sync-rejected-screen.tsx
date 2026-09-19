/**
 * SyncRejectedScreen — "No enviados" (A-08): every record the server refused,
 * newest first, each with its reason and a retry. One purged product
 * usually rejects several records (the sale and its stock movement), so
 * "Reintentar todos" retries every row that is waiting for a human.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { RejectedRow } from '@xangarro/sync';
import { Btn, EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import { describeRejectedRow } from './describe-rejected-row';
import { RejectedRowCard } from './rejected-row-card';

export interface SyncRejectedScreenProps {
  readonly rows: readonly RejectedRow[];
  readonly onRetry: (rows: readonly RejectedRow[]) => void;
}

export function SyncRejectedScreen(props: SyncRejectedScreenProps): ReactElement {
  const { t } = useTranslation();
  const waiting = props.rows.filter((r) => !r.retryable);
  if (props.rows.length === 0) {
    return (
      <View flex={1} justifyContent="center" testID="no-enviados-screen">
        <EmptyState icon="check" title={t('noEnviados.empty')} testID="no-enviados-empty" />
      </View>
    );
  }
  return (
    <ScrollView testID="no-enviados-screen" contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.sm} color={colors.gray600}>
        {t('noEnviados.intro')}
      </Text>
      {waiting.length > 1 && (
        <Btn variant="dark" onPress={() => props.onRetry(waiting)} testID="no-enviados-retry-all">
          {t('noEnviados.retryAll', { count: waiting.length })}
        </Btn>
      )}
      {props.rows.map((r) => (
        <RejectedRowCard
          key={`${r.tableName}:${r.rowId}`}
          view={describeRejectedRow(r)}
          onRetry={() => props.onRetry([r])}
        />
      ))}
    </ScrollView>
  );
}
