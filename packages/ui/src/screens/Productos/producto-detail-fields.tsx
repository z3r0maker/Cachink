/**
 * ProductoDetailFields — sub-field groups for the inline-editable
 * product detail page. Extracted to keep the main screen under 200
 * lines.
 *
 * StockActionCard lives in producto-stock-card.tsx.
 * PricingSection lives in producto-pricing-section.tsx.
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { InventoryCategory, ProductIcon } from '@cachink/domain';
import { resolveProductIcon } from '@cachink/domain';
import { ColorSwatchPicker, Icon, Input } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { IconName } from '../../components/Icon/icon.shared';
import { StepperField, TextField } from '../../components/fields/index';
import { colors, fontSizes, typography } from '../../theme';
import { INV_CATEGORIAS } from './nuevo-producto-form';
import { SectionHeader } from './section-header';

// Re-export extracted modules so existing imports keep working.
export { StockActionCard } from './producto-stock-card';
export { PricingSection } from './producto-pricing-section';

import type { InventoryUnit, UsoProducto } from '@cachink/domain';

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
  const { t } = useTranslation();
  const resolved = resolveProductIcon(props.icono, props.categoria);
  return (
    <View alignItems="center" gap={6} marginBottom={8}>
      <Pressable
        onPress={props.onSelectIcon}
        testID="detail-icon-tap"
        role="button"
        aria-label={t('productos.selectIconAriaLabel')}
      >
        <Icon name={resolved as IconName} size={48} color={colors.black} />
      </Pressable>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={fontSizes.sm}
        color={colors.blueText}
        onPress={props.onSelectIcon}
        testID="detail-change-icon-link"
      >
        Cambiar ícono
      </Text>
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
      <TextField
        label="Nombre"
        value={props.state.nombre}
        onChange={(v) => props.onChange({ nombre: v })}
        error={props.errors.nombre}
        required
        testID="detail-nombre"
      />
      <TextField
        label="SKU"
        value={props.state.sku}
        onChange={(v) => props.onChange({ sku: v })}
        testID="detail-sku"
      />
      <Input
        type="select"
        label="Categoría"
        value={props.state.categoria}
        onChange={(v) => props.onChange({ categoria: v as InventoryCategory })}
        options={INV_CATEGORIAS}
        testID="detail-categoria"
      />
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
      <StepperField
        label="Umbral stock bajo"
        value={Number(props.state.umbral) || 0}
        onChange={(v) => props.onChange({ umbral: String(v) })}
        min={0}
        max={100}
        error={props.errors.umbral}
        testID="detail-umbral"
      />
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
      <ColorSwatchPicker
        label="Color de fondo"
        value={props.state.colorFondo as never}
        onChange={(v) => props.onChange({ colorFondo: v })}
        testID="detail-color-fondo"
      />
    </>
  );
}
