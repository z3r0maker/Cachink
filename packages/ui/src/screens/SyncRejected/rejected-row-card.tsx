/**
 * RejectedRowCard — one record the server refused (A-08). Shows what it is,
 * why, what to do, and "Reintentar". There is deliberately no delete: the
 * record stays on the device until the server accepts it.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import type { RejectedRowView } from './describe-rejected-row';

export interface RejectedRowCardProps {
  readonly view: RejectedRowView;
  readonly onRetry: () => void;
}

function Line(props: { text: string; muted?: boolean; bold?: boolean; testID?: string }) {
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontSize={props.bold ? fontSizes.md : fontSizes.sm}
      fontWeight={props.bold ? typography.weights.bold : typography.weights.regular}
      color={props.muted ? colors.gray600 : colors.black}
      testID={props.testID}
    >
      {props.text}
    </Text>
  );
}

export function RejectedRowCard(props: RejectedRowCardProps): ReactElement {
  const { t } = useTranslation();
  const v = props.view;
  const tr = (key: string): string => t(key as never);
  const title = v.detail ? `${tr(v.kindKey)} · ${v.detail}` : tr(v.kindKey);
  const reason = v.reasonKey ? tr(v.reasonKey) : v.fallbackMessage;
  return (
    <Card padding="md" testID={`no-enviado-${v.key}`}>
      <View gap={6}>
        <Line text={title} bold />
        <Line text={reason} testID={`no-enviado-reason-${v.key}`} />
        {v.hintKey && <Line text={tr(v.hintKey)} muted />}
        {v.retrying ? (
          <Line text={t('noEnviados.retrying')} muted testID={`no-enviado-retrying-${v.key}`} />
        ) : (
          <Btn variant="dark" onPress={props.onRetry} testID={`no-enviado-retry-${v.key}`}>
            {t('noEnviados.retry')}
          </Btn>
        )}
      </View>
    </Card>
  );
}
