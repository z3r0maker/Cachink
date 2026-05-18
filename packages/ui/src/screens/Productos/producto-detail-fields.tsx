/**
 * ProductoDetailFields — sub-field groups for the inline-editable
 * product detail page. Extracted to keep the main screen under 200
 * lines.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { InventoryCategory, InventoryUnit, ProductIcon, UsoProducto } from '@cachink/domain';
import { resolveProductIcon } from '@cachink/domain';
import {
  Btn,
  ColorSwatchPicker,
  Combobox,
  Icon,
  Input,
  OptionCardGroup,
} from '../../components/index';
import type { IconName } from '../../components/Icon/icon.shared';
import { MoneyField, StepperField, TextField } from '../../components/fields/index';
import { colors, typography } from '../../theme';
import {
  INV_CATEGORIAS,
  INV_UNIDADES_OPTIONS,
  USO_PRODUCTO_CARDS,
} from './nuevo-producto-form';
import { SectionHeader } from './section-header';

type T = (key: string) => string;

export interface DetailFormState {
  nombre: string;
  sku: string;
  categoria: InventoryCategory;
  usoProducto: UsoProducto;
  costoPesos: string;
  precioVentaPesos: string;
  unidad: InventoryUnit;
  umbral: string;
  colorFondo: string;
  icono: ProductIcon | null;
}

export interface DetailFormErrors {
  nombre?: string;
  costo?: string;
  precioVenta?: string;
  umbral?: string;
}

/** Icon area: large tappable icon + "Cambiar ícono" link. */
export function IconArea(props: {
  icono: ProductIcon | null;
  categoria: InventoryCategory;
  onSelectIcon: () => void;
  t: T;
}): ReactElement {
  const resolved = resolveProductIcon(props.icono, props.categoria);
  return (
    <View alignItems="center" gap={6} marginBottom={8}>
      <Pressable onPress={props.onSelectIcon} testID="detail-icon-tap">
        <Icon name={resolved as IconName} size={48} color={colors.black} />
      </Pressable>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={13}
        color={colors.blue}
        onPress={props.onSelectIcon}
        testID="detail-change-icon-link"
      >
        Cambiar ícono
      </Text>
    </View>
  );
}

function stockStatus(stock: number, umbral: number) {
  const isLow = stock <= umbral;
  if (stock <= 0) return { bg: colors.redSoft, fg: colors.red, label: 'Sin stock' };
  if (isLow) return { bg: colors.warningSoft, fg: colors.warning, label: 'Bajo' };
  return { bg: colors.greenSoft, fg: colors.green, label: 'Saludable' };
}

function StockActions(props: { onEntrada: () => void; onSalida: () => void }): ReactElement {
  return (
    <View flexDirection="row" gap={8}>
      <View flex={1}>
        <Btn variant="green" onPress={props.onEntrada} fullWidth testID="detail-entrada" icon={<Icon name="plus" size={16} color={colors.white} />}>
          Entrada
        </Btn>
      </View>
      <View flex={1}>
        <Btn variant="primary" onPress={props.onSalida} fullWidth testID="detail-salida" icon={<Icon name="minus" size={16} color={colors.black} />}>
          Salida
        </Btn>
      </View>
    </View>
  );
}

/** Stock + Entrada / Salida card. */
export function StockActionCard(props: {
  stock: number;
  umbral: number;
  onEntrada: () => void;
  onSalida: () => void;
  t: T;
}): ReactElement {
  const s = stockStatus(props.stock, props.umbral);
  return (
    <View backgroundColor={colors.white} borderWidth={2} borderColor={colors.black} borderRadius={14} padding={16} gap={12}>
      <View flexDirection="row" alignItems="center" gap={12}>
        <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.black} fontSize={28} color={colors.black}>
          {props.stock}
        </Text>
        <View backgroundColor={s.bg} paddingHorizontal={10} paddingVertical={4} borderRadius={8}>
          <Text fontFamily={typography.fontFamily} fontWeight={typography.weights.bold} fontSize={12} color={s.fg}>{s.label}</Text>
        </View>
      </View>
      <StockActions onEntrada={props.onEntrada} onSalida={props.onSalida} />
    </View>
  );
}

/** Identity section: nombre + SKU. */
export function IdentitySection(props: {
  state: DetailFormState;
  errors: DetailFormErrors;
  onChange: (p: Partial<DetailFormState>) => void;
  t: T;
}): ReactElement {
  return (
    <>
      <SectionHeader label="Información" />
      <TextField label="Nombre" value={props.state.nombre} onChange={(v) => props.onChange({ nombre: v })} error={props.errors.nombre} required testID="detail-nombre" />
      <TextField label="SKU" value={props.state.sku} onChange={(v) => props.onChange({ sku: v })} testID="detail-sku" />
      <Input type="select" label="Categoría" value={props.state.categoria} onChange={(v) => props.onChange({ categoria: v as InventoryCategory })} options={INV_CATEGORIAS} testID="detail-categoria" />
    </>
  );
}

/** Pricing section: costo + precio + unidad. */
export function PricingSection(props: {
  state: DetailFormState;
  errors: DetailFormErrors;
  showPrecio: boolean;
  onChange: (p: Partial<DetailFormState>) => void;
  conversionEnabled: boolean;
  t: T;
}): ReactElement {
  return (
    <>
      <SectionHeader label="Precios" />
      <MoneyField label="Costo unitario" value={props.state.costoPesos} onChange={(v) => props.onChange({ costoPesos: v })} error={props.errors.costo} required testID="detail-costo" />
      {props.showPrecio && (
        <MoneyField label="Precio venta" value={props.state.precioVentaPesos} onChange={(v) => props.onChange({ precioVentaPesos: v })} error={props.errors.precioVenta} required testID="detail-precio" />
      )}
      <Combobox label="Unidad" value={props.state.unidad} onChange={(v) => props.onChange({ unidad: v as InventoryUnit })} options={INV_UNIDADES_OPTIONS} testID="detail-unidad" />
      {props.conversionEnabled && (
        <OptionCardGroup label="Uso del producto" value={props.state.usoProducto} onChange={(v) => props.onChange({ usoProducto: v as UsoProducto })} options={USO_PRODUCTO_CARDS} testID="detail-uso" />
      )}
    </>
  );
}

/** Inventory threshold section. */
export function InventorySection(props: {
  state: DetailFormState;
  errors: DetailFormErrors;
  onChange: (p: Partial<DetailFormState>) => void;
}): ReactElement {
  return (
    <>
      <SectionHeader label="Inventario" />
      <StepperField label="Umbral stock bajo" value={Number(props.state.umbral) || 0} onChange={(v) => props.onChange({ umbral: String(v) })} min={0} max={100} error={props.errors.umbral} testID="detail-umbral" />
    </>
  );
}

/** Appearance section: color picker. */
export function AppearanceSection(props: {
  state: DetailFormState;
  onChange: (p: Partial<DetailFormState>) => void;
}): ReactElement {
  return (
    <>
      <SectionHeader label="Apariencia" />
      <ColorSwatchPicker label="Color de fondo" value={props.state.colorFondo as never} onChange={(v) => props.onChange({ colorFondo: v })} testID="detail-color-fondo" />
    </>
  );
}
