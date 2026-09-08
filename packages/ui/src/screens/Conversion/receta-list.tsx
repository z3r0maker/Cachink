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
import { colors, fontSizes } from '../../theme';

export interface RecetaListProps {
  readonly recetas: readonly ConversionReceta[];
  readonly products: ReadonlyMap<string, Product>;
  readonly onConvertir: (receta: ConversionReceta) => void;
  readonly onEliminar: (receta: ConversionReceta) => void;
  readonly testID?: string;
}

/** Convert / delete actions for one recipe row. Split out to keep `RecetaRow`
 *  inside the §2.6 40-line budget once both actions carry accessible names. */
function RecetaRowActions(props: {
  onConvertir: () => void;
  onEliminar: () => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <TouchableOpacity
        onPress={props.onConvertir}
        testID="receta-convertir-btn"
        role="button"
        aria-label={t('conversion.convertirAriaLabel')}
      >
        <Icon name="refresh-cw" size={20} color={colors.blue} />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={props.onEliminar}
        testID="receta-eliminar-btn"
        role="button"
        aria-label={t('conversion.eliminarAriaLabel')}
      >
        <Icon name="trash-2" size={20} color={colors.red} />
      </TouchableOpacity>
    </>
  );
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
      borderBottomColor={colors.black}
      testID="receta-row"
    >
      <View flex={1} gap={4}>
        <Text fontWeight="700" fontSize={fontSizes.lg} color={colors.black}>
          {mp?.nombre ?? '—'} → {prod?.nombre ?? '—'}
        </Text>
        <Text fontSize={fontSizes.sm} color={colors.gray600}>
          {props.receta.cantidadOrigen} {mp?.unidad ?? ''} → {props.receta.cantidadResultante}{' '}
          {prod?.unidad ?? ''}
        </Text>
      </View>
      <RecetaRowActions onConvertir={props.onConvertir} onEliminar={props.onEliminar} />
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
