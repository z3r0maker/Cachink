/**
 * CajaActiveTurnView — shows balance + deposit/withdraw + cerrar buttons
 * for an open caja turn.
 *
 * Extracted from caja-content.tsx to respect 200-line budget.
 */

import { type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { CajaTurno } from '@cachink/domain';
import { CajaStatusCard } from './caja-status-card';
import { CajaBalanceCard } from './caja-balance-card';
import { Btn } from '../../components/Btn/btn';
import { useTranslation } from '../../i18n/index';
import { useTurnBalance } from './use-turn-balance';

export interface CajaActiveTurnViewProps {
  readonly turno: CajaTurno;
  readonly onCerrar: () => void;
  readonly onDeposit: () => void;
  readonly onWithdraw: () => void;
}

export function CajaActiveTurnView(props: CajaActiveTurnViewProps): ReactElement {
  const { t } = useTranslation();
  const balance = useTurnBalance(props.turno);

  return (
    <View gap={12}>
      <CajaStatusCard turno={props.turno} onCerrar={props.onCerrar} />
      <CajaBalanceCard balance={balance} />
      <CajaActionButtons
        onDeposit={props.onDeposit}
        onWithdraw={props.onWithdraw}
      />
      <Btn variant="dark" onPress={props.onCerrar} fullWidth testID="caja-cerrar-btn">
        {t('caja.cerrarTitle')}
      </Btn>
    </View>
  );
}

function CajaActionButtons(props: {
  onDeposit: () => void;
  onWithdraw: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <Btn variant="green" onPress={props.onDeposit} fullWidth testID="caja-deposit-btn">
          + Agregar efectivo
        </Btn>
      </View>
      <View flex={1}>
        <Btn variant="danger" onPress={props.onWithdraw} fullWidth testID="caja-withdraw-btn">
          − Retirar efectivo
        </Btn>
      </View>
    </View>
  );
}
