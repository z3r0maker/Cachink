/**
 * ConversionHistorial — flat list of past conversions.
 * Phase 18.
 */

import type { ReactElement } from 'react';
import { FlatList } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { Conversion, Product } from '@cachink/domain';
import { EmptyState } from '../../components/index';
import { useTranslation } from '../../i18n/index';

export interface ConversionHistorialProps {
  readonly conversiones: readonly Conversion[];
  readonly products: ReadonlyMap<string, Product>;
  readonly testID?: string;
}

function HistorialRow(props: {
  conversion: Conversion;
  products: ReadonlyMap<string, Product>;
}): ReactElement {
  const mp = props.products.get(props.conversion.materiaPrimaId as string);
  const prod = props.products.get(props.conversion.productoResultanteId as string);
  return (
    <View
      padding={12}
      gap={4}
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      testID="historial-row"
    >
      <Text fontWeight="700" fontSize={14} color="$color">
        {mp?.nombre ?? '—'} → {prod?.nombre ?? '—'}
      </Text>
      <Text fontSize={13} color="$colorSubtle">
        -{props.conversion.cantidadOrigenUsada} {mp?.unidad ?? ''} / +
        {props.conversion.cantidadResultanteCreada} {prod?.unidad ?? ''}
      </Text>
      <Text fontSize={12} color="$colorSubtle">
        {props.conversion.createdAt}
      </Text>
    </View>
  );
}

export function ConversionHistorial(props: ConversionHistorialProps): ReactElement {
  const { t } = useTranslation();

  if (props.conversiones.length === 0) {
    return (
      <EmptyState
        icon="refresh-cw"
        title={t('conversion.emptyHistorial')}
        description={t('conversion.emptyHistorialHint')}
        testID="empty-historial"
      />
    );
  }

  return (
    <FlatList
      data={props.conversiones as Conversion[]}
      keyExtractor={(c) => c.id}
      renderItem={({ item }) => (
        <HistorialRow conversion={item} products={props.products} />
      )}
      testID={props.testID ?? 'conversion-historial'}
    />
  );
}
