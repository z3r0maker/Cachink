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
import { Icon } from '../../components/index';
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
  // Costo is optional (review item #5) — mirrors `validateProducto`
  // on the create path. Blank means "unknown", not "invalid".
  if (state.costoPesos.trim() !== '') {
    const c = Number(state.costoPesos);
    if (!Number.isFinite(c) || c < 0) e.costo = 'Monto inválido';
  }
  if (state.usoProducto !== 'materia-prima') {
    const pv = Number(state.precioVentaPesos);
    if (!Number.isFinite(pv) || pv <= 0) e.precioVenta = 'Mayor a 0';
  }
  return e;
}

/*
  Save action is a raw <Pressable>, NOT the shared <Btn>, on purpose.
  <Btn> sets accessibilityRole="button" + accessibilityLabel, so RN collapses it into
  a single merged a11y element. In THIS header (form ScrollView sibling rendered over
  the header row) that merged element was not reliably tappable — <Btn> here never
  fired its onPress under Maestro/XCUITest across many runs, while the adjacent raw
  <Pressable> `detail-back` always did. A raw <Pressable> (native coordinate touch,
  not merged) fires reliably and was verified green end-to-end. Same <Btn> works fine
  elsewhere (e.g. MovimientoModal), so this is context-specific.
  Full investigation + evidence: docs/e2e-productos-row-accessibility-scope.md.
*/
function DetailSaveButton(props: {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
}): ReactElement {
  const disabled = !props.dirty || props.saving;
  return (
    <Pressable
      onPress={props.onSave}
      disabled={disabled}
      testID="detail-save"
      style={({ pressed }) => [
        {
          backgroundColor: props.dirty ? colors.yellow : 'transparent',
          borderColor: colors.black,
          borderWidth: 2,
          borderRadius: 10,
          height: 44,
          paddingHorizontal: 18,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        },
        pressed ? { transform: [{ translateX: 2 }, { translateY: 2 }] } : null,
      ]}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={14}
        color={colors.black}
      >
        Guardar
      </Text>
    </Pressable>
  );
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
      <DetailSaveButton dirty={props.dirty} saving={props.saving} onSave={props.onSave} />
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
