/**
 * CajaGateBanner — blocks the Ventas screen when no CajaTurno is open.
 *
 * Displayed as an EmptyState with a CTA to navigate to /caja.
 * Double-protection: the use case also throws CajaNoAbiertaError if
 * somehow checkout is reached without an open turno.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../../components/Btn/index';
import { EmptyState } from '../../components/EmptyState/index';
import { Icon } from '../../components/Icon/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';

export interface CajaGateBannerProps {
  readonly onGoToCaja: () => void;
  readonly testID?: string;
}

export function CajaGateBanner(props: CajaGateBannerProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1} justifyContent="center" alignItems="center" padding={32}>
      <EmptyState
        icon="landmark"
        title={t('ventas.cajaGateTitle')}
        description={t('ventas.cajaGateDescription')}
        action={
          <Btn
            variant="dark"
            size="lg"
            icon={<Icon name="landmark" size={18} color={colors.white} />}
            onPress={props.onGoToCaja}
            testID="caja-gate-go-to-caja"
          >
            {t('ventas.cajaGateCta')}
          </Btn>
        }
        testID={props.testID ?? 'caja-gate-banner'}
      />
    </View>
  );
}
