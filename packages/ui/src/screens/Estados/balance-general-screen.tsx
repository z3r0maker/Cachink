/**
 * BalanceGeneralScreen — NIF B-6.
 *
 * Restructured with punchline-first ResumenCard, HelpAccordions
 * on every term, and delta indicator on Total Activo.
 *
 * Pure presentation. The cards themselves live in
 * `./balance-general-cards` and `./balance-general-detail-cards`.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { BalanceGeneral } from '@cachink/domain';
import { SectionTitle } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { EmptyCard, ResumenCard } from './balance-general-cards';
import { ActivoCard, PasivoCapitalCard } from './balance-general-detail-cards';

export interface BalanceGeneralScreenProps {
  readonly balance: BalanceGeneral | null;
  readonly periodoLabel: string;
  readonly priorBalance?: BalanceGeneral | null;
  readonly testID?: string;
}

export function BalanceGeneralScreen(props: BalanceGeneralScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID={props.testID ?? 'balance-general-screen'} gap={14}>
      <SectionTitle title={props.periodoLabel} />
      {props.balance === null ? (
        <EmptyCard title={t('estados.emptyPeriodTitle')} body={t('estados.emptyPeriodBody')} />
      ) : (
        <>
          <ResumenCard balance={props.balance} prior={props.priorBalance} t={t} />
          <View flexDirection="row" flexWrap="wrap" gap={14}>
            <View flex={1} minWidth={260}>
              <ActivoCard balance={props.balance} t={t} />
            </View>
            <View flex={1} minWidth={260}>
              <PasivoCapitalCard balance={props.balance} t={t} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}
