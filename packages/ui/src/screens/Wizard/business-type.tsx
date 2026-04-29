/**
 * BusinessType — wizard step for choosing the business archetype.
 *
 * Four cards: producto-con-stock / producto-sin-stock / servicio / mixto.
 * Each card sets tipoNegocio, categoriaVentaPredeterminada, and pre-seeds
 * atributosProducto on the parent wizard state.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import type { AttrDef, TipoNegocio } from '@cachink/domain';
import { WizardCard } from './wizard-card';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface BusinessTypeChoice {
  readonly tipoNegocio: TipoNegocio;
  readonly categoriaVentaPredeterminada: 'Producto' | 'Servicio';
  readonly atributosProducto: readonly AttrDef[];
}

export interface BusinessTypeProps {
  readonly onSelect: (choice: BusinessTypeChoice) => void;
  readonly testID?: string;
}

const ATTR_TALLA: AttrDef = { clave: 'talla', label: 'Talla', tipo: 'select', opciones: ['S', 'M', 'L', 'XL'], obligatorio: false };
const ATTR_COLOR: AttrDef = { clave: 'color', label: 'Color', tipo: 'texto', obligatorio: false };
const ATTR_MARCA: AttrDef = { clave: 'marca', label: 'Marca', tipo: 'texto', obligatorio: false };
const ATTR_DURACION: AttrDef = { clave: 'duracion', label: 'Duración', tipo: 'texto', obligatorio: false };

interface CardDef {
  readonly key: TipoNegocio;
  readonly icon: 'package' | 'shopping-bag' | 'clipboard-list' | 'layout-grid';
  readonly titleKey: string;
  readonly hintKey: string;
  readonly choice: BusinessTypeChoice;
}

const CARDS: readonly CardDef[] = [
  {
    key: 'producto-con-stock',
    icon: 'package',
    titleKey: 'wizard.businessType.productoConStock',
    hintKey: 'wizard.businessType.productoConStockHint',
    choice: {
      tipoNegocio: 'producto-con-stock',
      categoriaVentaPredeterminada: 'Producto',
      atributosProducto: [ATTR_TALLA, ATTR_COLOR, ATTR_MARCA],
    },
  },
  {
    key: 'producto-sin-stock',
    icon: 'shopping-bag',
    titleKey: 'wizard.businessType.productoSinStock',
    hintKey: 'wizard.businessType.productoSinStockHint',
    choice: {
      tipoNegocio: 'producto-sin-stock',
      categoriaVentaPredeterminada: 'Producto',
      atributosProducto: [],
    },
  },
  {
    key: 'servicio',
    icon: 'clipboard-list',
    titleKey: 'wizard.businessType.servicio',
    hintKey: 'wizard.businessType.servicioHint',
    choice: {
      tipoNegocio: 'servicio',
      categoriaVentaPredeterminada: 'Servicio',
      atributosProducto: [ATTR_DURACION],
    },
  },
  {
    key: 'mixto',
    icon: 'layout-grid',
    titleKey: 'wizard.businessType.mixto',
    hintKey: 'wizard.businessType.mixtoHint',
    choice: {
      tipoNegocio: 'mixto',
      categoriaVentaPredeterminada: 'Producto',
      atributosProducto: [],
    },
  },
];

function BusinessTypeHeader({ t }: { t: ReturnType<typeof useTranslation>['t'] }): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={24}
        color={colors.black}
        letterSpacing={typography.letterSpacing.tighter}
        textAlign="center"
      >
        {t('wizard.businessType.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
        textAlign="center"
      >
        {t('wizard.businessType.subtitle')}
      </Text>
    </>
  );
}

export function BusinessType(props: BusinessTypeProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID={props.testID ?? 'wizard-business-type'} flex={1} padding={24} gap={16} alignItems="center">
      <BusinessTypeHeader t={t} />
      {CARDS.map((card) => (
        <WizardCard
          key={card.key}
          icon={card.icon}
          title={t(card.titleKey as never)}
          hint={t(card.hintKey as never)}
          onPress={() => props.onSelect(card.choice)}
          testID={`wizard-btype-${card.key}`}
        />
      ))}
    </View>
  );
}
