/**
 * ProductoDetailScreen — inline-editable full-page product form.
 *
 * Replaces the popover + EditarProductoModal flow with a single
 * dedicated route page. All product fields are editable in place.
 */

import { useEffect, useState, type ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { Product, ProductIcon } from '@cachink/domain';
import { fromPesos, toPesosString } from '@cachink/domain';
import type { ProductPatch } from '@cachink/data';
import { Btn, Icon } from '../../components/index';
import { colors, typography } from '../../theme';
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
  /** Override icon from zustand store when returning from picker. */
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
    <View flexDirection="row" alignItems="center" justifyContent="space-between" paddingHorizontal={16} paddingVertical={12}>
      <Pressable onPress={props.onBack} testID="detail-back">
        <Icon name="chevron-left" size={24} color={colors.black} />
      </Pressable>
      <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={18} color={colors.black} numberOfLines={1} flex={1} textAlign="center">
        {props.nombre}
      </Text>
      <Btn variant={props.dirty ? 'primary' : 'ghost'} onPress={props.onSave} disabled={!props.dirty || props.saving} testID="detail-save">
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

  const update = (p: Partial<DetailFormState>): void => { setState((s) => ({ ...s, ...p })); setDirty(true); };
  return { state, errors, setErrors, dirty, update };
}

export function ProductoDetailScreen(props: ProductoDetailScreenProps): ReactElement {
  const { state, errors, setErrors, dirty, update } = useDetailForm(props.producto, props.iconOverride);

  const handleSave = (): void => {
    const v = validate(state);
    if (Object.keys(v).length > 0) { setErrors(v); return; }
    setErrors({});
    props.onSave(buildPatch(state));
  };

  const id = (k: string) => k;
  return (
    <View testID={props.testID ?? 'producto-detail-screen'} flex={1} backgroundColor={colors.offwhite}>
      <DetailTopBar nombre={props.producto.nombre} dirty={dirty} saving={props.saving} onBack={props.onBack} onSave={handleSave} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 80 }}>
        <IconArea icono={state.icono} categoria={state.categoria} onSelectIcon={props.onSelectIcon} t={id} />
        <StockActionCard stock={props.stock} umbral={Number(state.umbral) || 0} onEntrada={props.onEntrada} onSalida={props.onSalida} t={id} />
        <IdentitySection state={state} errors={errors} onChange={update} t={id} />
        <PricingSection state={state} errors={errors} showPrecio={state.usoProducto !== 'materia-prima'} onChange={update} conversionEnabled={props.conversionEnabled} t={id} />
        <InventorySection state={state} errors={errors} onChange={update} />
        <AppearanceSection state={state} onChange={update} />
        <View marginTop={24}>
          <Btn variant="danger" onPress={props.onDelete} disabled={props.deleting} fullWidth testID="detail-delete" icon={<Icon name="trash-2" size={18} color={colors.white} />}>
            Eliminar producto
          </Btn>
        </View>
      </ScrollView>
    </View>
  );
}
