/** ConteoActionBar — cancel / save / finalize buttons for the conteo. */

import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../../components/index';
import type { useTranslation } from '../../i18n/index';

type T = ReturnType<typeof useTranslation>['t'];

export interface ConteoActionBarProps {
  readonly isPending: boolean;
  readonly allCounted: boolean;
  readonly onCancel: () => void;
  readonly onSave: () => void;
  readonly onFinalize: () => void;
  readonly t: T;
}

function CancelBtn({
  onCancel,
  isPending,
  t,
}: Pick<ConteoActionBarProps, 'onCancel' | 'isPending' | 't'>): ReactElement {
  return (
    <Btn variant="ghost" onPress={onCancel} disabled={isPending} fullWidth testID="conteo-cancelar">
      {t('auditoria.cancelar' as never)}
    </Btn>
  );
}

function SaveBtn({
  onSave,
  isPending,
  t,
}: Pick<ConteoActionBarProps, 'onSave' | 'isPending' | 't'>): ReactElement {
  return (
    <Btn variant="ghost" onPress={onSave} disabled={isPending} fullWidth testID="conteo-save">
      {t('actions.save' as never)}
    </Btn>
  );
}

function FinalizeBtn({
  onFinalize,
  allCounted,
  isPending,
  t,
}: Pick<ConteoActionBarProps, 'onFinalize' | 'allCounted' | 'isPending' | 't'>): ReactElement {
  return (
    <Btn
      onPress={onFinalize}
      disabled={!allCounted || isPending}
      fullWidth
      testID="conteo-finalizar"
    >
      {t('auditoria.finalizar' as never)}
    </Btn>
  );
}

export function ConteoActionBar(props: ConteoActionBarProps): ReactElement {
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <CancelBtn onCancel={props.onCancel} isPending={props.isPending} t={props.t} />
      </View>
      <View flex={1}>
        <SaveBtn onSave={props.onSave} isPending={props.isPending} t={props.t} />
      </View>
      <View flex={1}>
        <FinalizeBtn
          onFinalize={props.onFinalize}
          allCounted={props.allCounted}
          isPending={props.isPending}
          t={props.t}
        />
      </View>
    </View>
  );
}
