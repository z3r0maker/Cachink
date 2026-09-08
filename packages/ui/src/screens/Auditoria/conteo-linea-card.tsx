/**
 * ConteoLineaCard — single product line inside an inventory count.
 * Displays product name, system stock, and an editable real-stock field.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { AuditoriaLinea } from '@cachink/domain';
import { Card } from '../../components/index';
import { IntegerField } from '../../components/fields/index';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

export interface ConteoLineaCardProps {
  readonly linea: AuditoriaLinea;
  readonly onChange: (value: string) => void;
}

function StockRow({ linea, onChange }: ConteoLineaCardProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" gap={12} alignItems="center">
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.xs} color={colors.gray600}>
        {t('auditoria.stockSistema')}: {linea.stockSistema}
      </Text>
      <View flex={1}>
        <IntegerField
          label={t('auditoria.stockReal')}
          value={linea.stockReal !== null ? String(linea.stockReal) : ''}
          onChange={onChange}
          min={0}
          testID={`conteo-real-${linea.productoId}`}
        />
      </View>
    </View>
  );
}

export function ConteoLineaCard(props: ConteoLineaCardProps): ReactElement {
  const { linea } = props;
  return (
    <Card padding="sm" fullWidth testID={`conteo-linea-${linea.productoId}`}>
      <View gap={4}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={fontSizes.md}
          color={colors.black}
          numberOfLines={1}
        >
          {linea.productoNombre}
        </Text>
        <StockRow {...props} />
      </View>
    </Card>
  );
}
