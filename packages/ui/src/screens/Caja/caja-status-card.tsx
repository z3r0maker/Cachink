/**
 * CajaStatusCard — shows current turn status on Operativo home.
 *
 * Displays: user name, time elapsed, opening amount.
 * Phase 6 of the Feature Flags plan: Caja.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { CajaTurno } from '@cachink/domain';
import { Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { formatMoney } from '@cachink/domain';

export interface CajaStatusCardProps {
  readonly turno: CajaTurno;
  readonly onCerrar: () => void;
  readonly testID?: string;
}

export function CajaStatusCard(props: CajaStatusCardProps): ReactElement {
  const { t } = useTranslation();
  const apertura = formatMoney(props.turno.montoAperturaCentavos);

  return (
    <Card testID={props.testID ?? 'caja-status-card'} variant="white" padding="md" fullWidth>
      <View gap={4}>
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={16}
          color={colors.black}
        >
          {t('caja.turnoAbierto')}
        </Text>
        <Text fontFamily={typography.fontFamily} fontSize={14} color={colors.gray600}>
          {t('caja.aperturaCon', { monto: apertura })}
        </Text>
      </View>
    </Card>
  );
}
