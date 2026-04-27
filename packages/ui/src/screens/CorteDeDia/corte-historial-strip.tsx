/**
 * CorteHistorialStrip — compact list of the last N cortes, rendered on
 * Director Home (Slice 3 C6).
 *
 * Each row shows fecha + efectivoContado + a Tag indicating whether the
 * corte cuadró (green), sobró (green), or faltó (red). Pure
 * presentation — the parent wires `useDayClosesRepository.findByDateRange`
 * (shipped in C7) and passes the rows down.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { formatMoney, type DayClose } from '@cachink/domain';
import { Card, SectionTitle, Tag } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface CorteHistorialStripProps {
  readonly cortes: readonly DayClose[];
  readonly testID?: string;
}

interface CorteRowProps {
  readonly corte: DayClose;
  readonly labelCuadra: string;
  readonly labelSobra: string;
  readonly labelFalta: string;
}

function diferenciaTag(
  diferencia: bigint,
  labels: Pick<CorteRowProps, 'labelCuadra' | 'labelSobra' | 'labelFalta'>,
): { variant: 'success' | 'danger' | 'neutral'; text: string } {
  if (diferencia === 0n) return { variant: 'neutral', text: labels.labelCuadra };
  if (diferencia > 0n) return { variant: 'success', text: labels.labelSobra };
  return { variant: 'danger', text: labels.labelFalta };
}

function CorteRow(props: CorteRowProps): ReactElement {
  const { corte } = props;
  const tag = diferenciaTag(corte.diferenciaCentavos, props);
  return (
    <View
      testID={`corte-row-${corte.id}`}
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingVertical={10}
    >
      <View flex={1}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={14}
          color={colors.black}
        >
          {corte.fecha}
        </Text>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={12}
          color={colors.gray600}
        >
          {formatMoney(corte.efectivoContadoCentavos)}
        </Text>
      </View>
      <Tag variant={tag.variant}>{tag.text}</Tag>
    </View>
  );
}

export function CorteHistorialStrip(props: CorteHistorialStripProps): ReactElement {
  const { t } = useTranslation();
  if (props.cortes.length === 0) {
    return (
      <Card testID={props.testID ?? 'corte-historial-empty'} padding="md" fullWidth>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.medium}
          fontSize={13}
          color={colors.gray600}
        >
          {t('corteDeDia.historialEmpty')}
        </Text>
      </Card>
    );
  }
  return (
    <View testID={props.testID ?? 'corte-historial'} gap={10}>
      <SectionTitle title={t('corteDeDia.historialTitle')} />
      <Card padding="md" fullWidth>
        <View>
          {props.cortes.map((c) => (
            <CorteRow
              key={c.id}
              corte={c}
              labelCuadra={t('corteDeDia.diferenciaCuadra')}
              labelSobra={t('corteDeDia.diferenciaSobra')}
              labelFalta={t('corteDeDia.diferenciaFalta')}
            />
          ))}
        </View>
      </Card>
    </View>
  );
}
