/**
 * AppearanceField — icon picker + color swatch for product form.
 *
 * Extracted from producto-form-fields.tsx per 200-line budget (Fix G).
 * Uses raw CSS color strings from theme constants (Fix A+B).
 */

import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import { ColorSwatchPicker, Icon } from '../../components/index';
import type { IconName } from '../../components/Icon/icon.shared';
import type { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import type { ProductoFormApi } from './nuevo-producto-form';

type T = ReturnType<typeof useTranslation>['t'];

export function AppearanceField({
  form,
  t,
  onPickIcon,
}: {
  form: ProductoFormApi;
  t: T;
  onPickIcon?: () => void;
}): ReactElement {
  return (
    <>
      {onPickIcon && (
        <Pressable onPress={onPickIcon} testID="producto-icon-picker-btn">
          <View
            flexDirection="row"
            alignItems="center"
            gap={12}
            padding={12}
            borderWidth={2}
            borderColor={colors.black}
            borderRadius={12}
          >
            {form.state.icono ? (
              <Icon name={form.state.icono as IconName} size={32} color={colors.black} />
            ) : (
              <Icon name="box" size={32} color={colors.gray400} />
            )}
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium.toString()}
              fontSize={14}
              color={colors.black}
              flex={1}
            >
              {form.state.icono
                ? t('nuevoProducto.changeIcon')
                : t('nuevoProducto.selectIcon')}
            </Text>
            <Icon name="chevron-right" size={20} color={colors.gray400} />
          </View>
        </Pressable>
      )}
      <ColorSwatchPicker
        label={t('nuevoProducto.colorFondoLabel')}
        value={form.state.colorFondo}
        onChange={(v) => form.update({ colorFondo: v })}
        testID="producto-color-fondo"
      />
    </>
  );
}
