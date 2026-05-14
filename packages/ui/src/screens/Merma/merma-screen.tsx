/**
 * MermaScreen — dedicated shrinkage tracking screen.
 *
 * Shows a product grid. Tapping a product opens a MermaConfirmSheet
 * to record the loss.
 *
 * Phase 7 of the Feature Flags plan: Merma.
 */

import { useState, type ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text } from '@tamagui/core';
import type { Product } from '@cachink/domain';
import { SafeAreaSpacer, ProductoCardGrid } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { MermaConfirmSheet } from './merma-confirm-sheet';

export interface MermaScreenProps {
  readonly productos: readonly Product[];
  readonly onRegisterMerma: (
    productoId: string,
    cantidad: number,
    reason: string,
    nota: string | null,
  ) => void;
  readonly submitting: boolean;
  readonly testID?: string;
}

export function MermaScreen(props: MermaScreenProps): ReactElement {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<Product | null>(null);
  const handleSubmit = (cant: number, reason: string, nota: string | null): void => {
    if (!selected) return;
    props.onRegisterMerma(selected.id, cant, reason, nota);
    setSelected(null);
  };
  return (
    <ScrollView
      testID={props.testID ?? 'merma-screen'}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        color={colors.black}
      >
        {t('merma.title')}
      </Text>
      <ProductoCardGrid
        productos={props.productos}
        mode="sell"
        onPress={(p) => setSelected(p)}
        testID="merma-grid"
      />
      {selected !== null && (
        <MermaConfirmSheet
          producto={selected}
          onSubmit={handleSubmit}
          onCancel={() => setSelected(null)}
          submitting={props.submitting}
        />
      )}
    </ScrollView>
  );
}
