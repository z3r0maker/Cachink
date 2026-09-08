/**
 * AuditoriaHistorial — past audits list with date, product count,
 * discrepancy count, and estado badge.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { AuditoriaInventario } from '@cachink/domain';
import { Card, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

export interface AuditoriaHistorialProps {
  readonly auditorias: readonly AuditoriaInventario[];
  readonly testID?: string;
}

function AuditoriaRow({ audit }: { audit: AuditoriaInventario }): ReactElement {
  const { t } = useTranslation();
  return (
    <Card testID={`audit-row-${audit.id}`} padding="md" fullWidth>
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <View flex={1} gap={4}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={fontSizes.md}
            color={colors.black}
          >
            {audit.fecha}
          </Text>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.regular}
            fontSize={fontSizes.xs}
            color={colors.gray600}
          >
            {audit.totalProductos} productos ·{' '}
            {t('auditoria.discrepancias', { count: audit.totalDiscrepancias })}
          </Text>
        </View>
        <Tag variant={audit.estado === 'finalizada' ? 'success' : 'neutral'}>
          {audit.estado === 'finalizada' ? 'Finalizada' : 'Borrador'}
        </Tag>
      </View>
    </Card>
  );
}

export function AuditoriaHistorial(props: AuditoriaHistorialProps): ReactElement {
  return (
    <View gap={8} testID={props.testID ?? 'auditoria-historial'}>
      {props.auditorias.map((a) => (
        <AuditoriaRow key={a.id} audit={a} />
      ))}
    </View>
  );
}
