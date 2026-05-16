/**
 * RecetaList — displays conversion recipes with product names resolved.
 * Phase 18.
 */

import type { ReactElement } from 'react';
import { FlatList, TouchableOpacity } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { ConversionReceta, Product } from '@cachink/domain';
import { EmptyState, Icon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';

export interface RecetaListProps {
  readonly recetas: readonly ConversionReceta[];
  readonly products: ReadonlyMap<string, Product>;
  readonly onConvertir: (receta: ConversionReceta) => void;
  readonly onEliminar: (receta: ConversionReceta) => void;
  readonly testID?: string;
}

function RecetaRow(props: {
  receta: ConversionReceta;
  products: ReadonlyMap<string, Product>;
  onConvertir: () => void;
  onEliminar: () => void;
}): ReactElement {
  const mp = props.products.get(props.receta.materiaPrimaId as string);
  const prod = props.products.get(props.receta.productoResultanteId as string);
  return (
    <View
      flexDirection="row"
      alignItems="center"
      padding={12}
      gap={12}
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      testID="receta-row"
    >
      <View flex={1} gap={4}>
        <Text fontWeight="700" fontSize={15} color="$color">
          {mp?.nombre ?? '—'} → {prod?.nombre ?? '—'}
        </Text>
        <Text fontSize={13} color="$colorSubtle">
          {props.receta.cantidadOrigen} {mp?.unidad ?? ''} → {props.receta.cantidadResultante}{' '}
          {prod?.unidad ?? ''}
        </Text>
      </View>
      <TouchableOpacity onPress={props.onConvertir} testID="receta-convertir-btn">
        <Icon name="refresh-cw" size={20} color={colors.blue} />
      </TouchableOpacity>
      <TouchableOpacity onPress={props.onEliminar} testID="receta-eliminar-btn">
        <Icon name="trash-2" size={20} color={colors.red} />
      </TouchableOpacity>
    </View>
  );
}

export function RecetaList(props: RecetaListProps): ReactElement {
  const { t } = useTranslation();

  if (props.recetas.length === 0) {
    return (
      <EmptyState
        icon="refresh-cw"
        title={t('conversion.emptyRecetas')}
        description={t('conversion.emptyRecetasHint')}
        testID="empty-recetas"
      />
    );
  }

  return (
    <FlatList
      data={props.recetas as ConversionReceta[]}
      keyExtractor={(r) => r.id}
      renderItem={({ item }) => (
        <RecetaRow
          receta={item}
          products={props.products}
          onConvertir={() => props.onConvertir(item)}
          onEliminar={() => props.onEliminar(item)}
        />
      )}
      testID={props.testID ?? 'receta-list'}
    />
  );
}
