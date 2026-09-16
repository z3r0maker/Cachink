/**
 * CxCCard — Director Home wrapper around CuentasPorCobrarStrip
 * (P1C-M10-T03, S4-C4).
 *
 * Wraps `useCuentasPorCobrar()` and renders the existing
 * `CuentasPorCobrarStrip` inside a collapsible Card. "Ver todo" routes
 * to `/cuentas-por-cobrar`.
 */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useCuentasPorCobrar } from '../../hooks/index';
import { useTranslation } from '../../i18n/index';
import { CuentasPorCobrarStrip } from '../CuentasPorCobrar/cuentas-por-cobrar-strip';

export interface CxCCardProps {
  readonly onVerTodo?: () => void;
  readonly testID?: string;
}

export function CxCCard(props: CxCCardProps): ReactElement | null {
  const { t } = useTranslation();
  const query = useCuentasPorCobrar();
  const rows = query.data ?? [];

  return (
    <Card testID={props.testID ?? 'cxc-card'} padding="md" fullWidth>
      <CuentasPorCobrarStrip rows={rows} testID="cxc-card-strip" />
      {rows.length > 0 && props.onVerTodo && (
        <View marginTop={10}>
          <Btn variant="soft" size="sm" onPress={props.onVerTodo} testID="cxc-card-ver-todo">
            {t('directorHome.cxcVerTodo')}
          </Btn>
        </View>
      )}
    </Card>
  );
}
