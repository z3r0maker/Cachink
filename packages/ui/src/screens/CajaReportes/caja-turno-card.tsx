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

function diferenciaVariant(diferencia: bigint | null): 'success' | 'danger' | 'neutral' {
  if (diferencia === null || diferencia === 0n) return diferencia === 0n ? 'success' : 'neutral';
  return 'danger';
}

export function CajaTurnoCard(props: CajaTurnoCardProps): ReactElement {
  const { t } = useTranslation();
  const { turno } = props;

  return (
    <Card testID={props.testID ?? `caja-turno-${turno.id}`} padding="md" fullWidth>
      <View gap={8}>
        <TurnoHeader fecha={turno.fecha} diff={turno.diferenciaCentavos} />
        <TurnoAmounts turno={turno} t={t} />
        <TurnoDiffLine diff={turno.diferenciaCentavos} t={t} />
        {turno.discrepancyReason !== null && (
          <Tag variant="neutral">{turno.discrepancyReason}</Tag>
        )}
      </View>
    </Card>
  );
}

type T = ReturnType<typeof useTranslation>['t'];

function TurnoHeader(props: { fecha: string; diff: bigint | null }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between" alignItems="center">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.black}
      >
        {props.fecha}
      </Text>
      {props.diff !== null && (
        <Tag variant={diferenciaVariant(props.diff)}>{formatMoney(props.diff)}</Tag>
      )}
    </View>
  );
}

function TurnoAmounts(props: { turno: CajaTurno; t: T }): ReactElement {
  return (
    <View flexDirection="row" justifyContent="space-between">
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
      >
        {props.t('cajaReportes.apertura')}: {formatMoney(props.turno.montoAperturaCentavos)}
      </Text>
      {props.turno.montoCierreCentavos !== null && (
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={13}
          color={colors.gray600}
        >
          {props.t('cajaReportes.cierre')}: {formatMoney(props.turno.montoCierreCentavos)}
        </Text>
      )}
    </View>
  );
}

function diferenciaColor(diferencia: bigint | null): string {
  if (diferencia === null) return colors.gray400;
  if (diferencia === 0n) return colors.green;
  if (diferencia < 0n) return colors.red;
  return colors.warning;
}

function TurnoDiffLine(props: { diff: bigint | null; t: T }): ReactElement | null {
  if (props.diff === null) return null;
  return (
    <Text
      fontFamily={typography.fontFamily}
      fontWeight={typography.weights.semibold}
      fontSize={13}
      color={diferenciaColor(props.diff)}
    >
      {props.t('cajaReportes.diferencia')}: {formatMoney(props.diff)}
    </Text>
  );
}
