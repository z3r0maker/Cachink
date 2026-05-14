/**
 * CajaTurnoCard — individual turn summary card showing apertura,
 * cierre, diferencia, and optional discrepancy reason.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type CajaTurno } from '@cachink/domain';
import { Card, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CajaTurnoCardProps {
  readonly turno: CajaTurno;
  readonly testID?: string;
}

function diferenciaColor(diferencia: bigint | null): string {
  if (diferencia === null) return colors.gray400;
  if (diferencia === 0n) return colors.green;
  if (diferencia < 0n) return colors.red;
  return colors.warning;
}

function diferenciaVariant(diferencia: bigint | null): 'success' | 'danger' | 'neutral' {
  if (diferencia === null) return 'neutral';
  if (diferencia === 0n) return 'success';
  return 'danger';
}

export function CajaTurnoCard(props: CajaTurnoCardProps): ReactElement {
  const { t } = useTranslation();
  const { turno } = props;
  const diff = turno.diferenciaCentavos;

  return (
    <Card testID={props.testID ?? `caja-turno-${turno.id}`} padding="md" fullWidth>
      <View gap={8}>
        <View flexDirection="row" justifyContent="space-between" alignItems="center">
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={14}
            color={colors.black}
          >
            {turno.fecha}
          </Text>
          {diff !== null && (
            <Tag variant={diferenciaVariant(diff)}>
              {formatMoney(diff)}
            </Tag>
          )}
        </View>

        <View flexDirection="row" justifyContent="space-between">
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.medium}
            fontSize={13}
            color={colors.gray600}
          >
            {t('cajaReportes.apertura')}: {formatMoney(turno.montoAperturaCentavos)}
          </Text>
          {turno.montoCierreCentavos !== null && (
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium}
              fontSize={13}
              color={colors.gray600}
            >
              {t('cajaReportes.cierre')}: {formatMoney(turno.montoCierreCentavos)}
            </Text>
          )}
        </View>

        {diff !== null && (
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.semibold}
            fontSize={13}
            color={diferenciaColor(diff)}
          >
            {t('cajaReportes.diferencia')}: {formatMoney(diff)}
          </Text>
        )}

        {turno.discrepancyReason !== null && (
          <Tag variant="neutral">{turno.discrepancyReason}</Tag>
        )}
      </View>
    </Card>
  );
}
