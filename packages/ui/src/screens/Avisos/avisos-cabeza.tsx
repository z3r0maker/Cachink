/**
 * Avisos' head (M-09): the title with its sub naming the owner, the quiet
 * «Marcar todo», and the two tabs with their unread counts (the web's
 * `Tabs`, the board's `{{ t.label }} {{ t.count }}`).
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import type { AvisoGrupo } from '@xangarro/caja/avisos';
import { deDueno, mayuscula } from '@xangarro/caja/avisos';
import { MText } from '../../components/Mostrador/index';
import { SegmentedTabs } from '../../components/SegmentedTabs/index';
import { colors } from '../../theme';

export function AvisosCabeza(p: {
  readonly dueno: string;
  readonly haySinLeer: boolean;
  readonly onMarcarTodo: () => void;
}): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <View flex={1} gap={2}>
        <MText size="xl4" weight="extraBold" letterSpacing={-0.9} role="heading">
          Avisos
        </MText>
        <MText size="md" weight="semibold" color={colors.gray600}>
          {`Lo que te manda ${p.dueno} y lo que la caja te avisa`}
        </MText>
      </View>
      {p.haySinLeer ? (
        <Pressable
          testID="avisos-marcar-todo"
          role="button"
          accessibilityLabel="Marcar todo como leído"
          onPress={p.onMarcarTodo}
          style={{ paddingVertical: 12, paddingHorizontal: 8 }}
        >
          <MText size="sm" weight="extraBold">
            Marcar todo
          </MText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function AvisosTabs(p: {
  readonly dueno: string;
  readonly value: AvisoGrupo;
  readonly sinLeer: (g: AvisoGrupo) => number;
  readonly onChange: (t: AvisoGrupo) => void;
}): ReactElement {
  return (
    <SegmentedTabs
      tabs={[
        { key: 'dueno' as const, label: mayuscula(deDueno(p.dueno)), count: p.sinLeer('dueno') },
        { key: 'caja' as const, label: 'De tu caja', count: p.sinLeer('caja') },
      ]}
      value={p.value}
      onChange={p.onChange}
      ariaLabel="Quién avisa"
      testID="avisos-tabs"
    />
  );
}
