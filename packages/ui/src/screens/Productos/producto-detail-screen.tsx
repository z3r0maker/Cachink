/**
 * ProductoDetailScreen — inline-editable full-page product form.
 *
 * DetailFormBody lives in producto-detail-form-body.tsx.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { Product, ProductIcon } from '@cachink/domain';
import { fromPesos, toPesosString } from '@cachink/domain';
import type { ProductPatch } from '@cachink/data';
import { Btn, Icon } from '../../components/index';
import { colors, typography } from '../../theme';
import { type DetailFormState, type DetailFormErrors } from './producto-detail-fields';
import { DetailFormBody } from './producto-detail-form-body';

export interface ProductoDetailScreenProps {
  readonly producto: Product;
  readonly stock: number;
  readonly conversionEnabled: boolean;
  readonly onSave: (patch: ProductPatch) => void;
  readonly saving: boolean;
  readonly onEntrada: () => void;
  readonly onSalida: () => void;
  readonly onDelete: () => void;
  readonly deleting: boolean;
  readonly onSelectIcon: () => void;
  readonly onBack: () => void;
  readonly iconOverride?: ProductIcon | null;
  readonly testID?: string;
}

function fromProduct(p: Product): DetailFormState {
  return {
    nombre: p.nombre,
    sku: p.sku ?? '',
    categoria: p.categoria,
    usoProducto: p.usoProducto ?? 'venta',
    costoPesos: toPesosString(p.costoUnitCentavos),
    precioVentaPesos: toPesosString(p.precioVentaCentavos),
    unidad: p.unidad,
    umbral: String(p.umbralStockBajo),
    colorFondo: p.colorFondo ?? 'white',
    icono: p.icono ?? null,
  };
}

function buildPatch(state: DetailFormState): ProductPatch {
  return {
    nombre: state.nombre.trim(),
    sku: state.sku.trim() === '' ? null : state.sku.trim(),
    categoria: state.categoria,
    usoProducto: state.usoProducto,
    unidad: state.unidad,
    umbralStockBajo: Math.max(0, Number(state.umbral) || 0),
    colorFondo: state.colorFondo as Product['colorFondo'],
    icono: state.icono,
    costoUnitCentavos: fromPesos(state.costoPesos || '0'),
    precioVentaCentavos: fromPesos(state.precioVentaPesos || '0'),
  };
}

function validate(state: DetailFormState): DetailFormErrors {
  const e: DetailFormErrors = {};
  if (!state.nombre.trim()) e.nombre = 'Requerido';
  const c = Number(state.costoPesos);
  if (!Number.isFinite(c) || c <= 0) e.costo = 'Mayor a 0';
  if (state.usoProducto !== 'materia-prima') {
    const pv = Number(state.precioVentaPesos);
    if (!Number.isFinite(pv) || pv <= 0) e.precioVenta = 'Mayor a 0';
  }
  return e;
}

function DetailTopBar(props: {
  nombre: string;
  dirty: boolean;
  saving: boolean;
  onBack: () => void;
  onSave: () => void;
}): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal={16}
      paddingVertical={12}
    >
      <Pressable onPress={props.onBack} testID="detail-back">
        <Icon name="chevron-left" size={24} color={colors.black} />
      </Pressable>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={18}
        color={colors.black}
        numberOfLines={1}
        flex={1}
        textAlign="center"
      >
        {props.nombre}
      </Text>
      <Btn
        variant={props.dirty ? 'primary' : 'ghost'}
        onPress={props.onSave}
        disabled={!props.dirty || props.saving}
        testID="detail-save"
      >
        Guardar
      </Btn>
    </View>
  );
}

function useDetailForm(producto: Product, iconOverride?: ProductIcon | null) {
  const [state, setState] = useState<DetailFormState>(fromProduct(producto));
  const [errors, setErrors] = useState<DetailFormErrors>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (iconOverride !== undefined) {
      setState((s) => ({ ...s, icono: iconOverride ?? null }));
      setDirty(true);
    }
  }, [iconOverride]);

  const update = (p: Partial<DetailFormState>): void => {
    setState((s) => ({ ...s, ...p }));
    setDirty(true);
  };
  return { state, errors, setErrors, dirty, update };
}

function useDetailSave(
  state: DetailFormState,
  setErrors: (e: DetailFormErrors) => void,
  onSave: (patch: ProductPatch) => void,
) {
  return (): void => {
    const v = validate(state);
    if (Object.keys(v).length > 0) {
      setErrors(v);
      return;
    }
    setErrors({});
    onSave(buildPatch(state));
  };
}

export function ProductoDetailScreen(props: ProductoDetailScreenProps): ReactElement {
  const form = useDetailForm(props.producto, props.iconOverride);
  const handleSave = useDetailSave(form.state, form.setErrors, props.onSave);

  return (
    <View
      testID={props.testID ?? 'producto-detail-screen'}
      flex={1}
      backgroundColor={colors.offwhite}
    >
      <DetailTopBar
        nombre={props.producto.nombre}
        dirty={form.dirty}
        saving={props.saving}
        onBack={props.onBack}
        onSave={handleSave}
      />
      <DetailFormBody
        state={form.state}
        errors={form.errors}
        update={form.update}
        screenProps={props}
      />
    </View>
  );
}
