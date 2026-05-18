/**
 * DetailFormBody — scrollable form content for ProductoDetailScreen.
 * Extracted to keep the parent screen under 200 lines.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { Btn, Icon } from '../../components/index';
import { colors } from '../../theme';
import {
  IconArea,
  StockActionCard,
  IdentitySection,
  PricingSection,
  InventorySection,
  AppearanceSection,
  type DetailFormState,
  type DetailFormErrors,
} from './producto-detail-fields';
import type { ProductoDetailScreenProps } from './producto-detail-screen';

function DeleteButton(props: { onDelete: () => void; deleting: boolean }): ReactElement {
  return (
    <View marginTop={24}>
      <Btn
        variant="danger"
        onPress={props.onDelete}
        disabled={props.deleting}
        fullWidth
        testID="detail-delete"
        icon={<Icon name="trash-2" size={18} color={colors.white} />}
      >
        Eliminar producto
      </Btn>
    </View>
  );
}

function FormSections(props: {
  state: DetailFormState;
  errors: DetailFormErrors;
  update: (p: Partial<DetailFormState>) => void;
  screenProps: ProductoDetailScreenProps;
}): ReactElement {
  const id = (k: string) => k;
  const umbral = Number(props.state.umbral) || 0;
  return (
    <>
      <IconArea
        icono={props.state.icono}
        categoria={props.state.categoria}
        onSelectIcon={props.screenProps.onSelectIcon}
        t={id}
      />
      <StockActionCard
        stock={props.screenProps.stock}
        umbral={umbral}
        onEntrada={props.screenProps.onEntrada}
        onSalida={props.screenProps.onSalida}
        t={id}
      />
      <IdentitySection state={props.state} errors={props.errors} onChange={props.update} t={id} />
      <PricingSection
        state={props.state}
        errors={props.errors}
        showPrecio={props.state.usoProducto !== 'materia-prima'}
        onChange={props.update}
        conversionEnabled={props.screenProps.conversionEnabled}
        t={id}
      />
      <InventorySection state={props.state} errors={props.errors} onChange={props.update} />
      <AppearanceSection state={props.state} onChange={props.update} />
    </>
  );
}

export function DetailFormBody(props: {
  state: DetailFormState;
  errors: DetailFormErrors;
  update: (p: Partial<DetailFormState>) => void;
  screenProps: ProductoDetailScreenProps;
}): ReactElement {
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}
    >
      <FormSections
        state={props.state}
        errors={props.errors}
        update={props.update}
        screenProps={props.screenProps}
      />
      <DeleteButton onDelete={props.screenProps.onDelete} deleting={props.screenProps.deleting} />
    </ScrollView>
  );
}
