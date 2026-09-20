/**
 * NuevoProductoScreen — quick-add a product from the counter (A-09).
 * Products are create-only on the device; editing happens in the portal.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Text } from '@tamagui/core';
import { Btn } from '../../components/index';
import type { CrearProductoInput } from '../../hooks/use-crear-producto';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';
import {
  buildProductoPayload,
  useProductoForm,
  validateProducto,
  validationMessages,
} from './nuevo-producto-form';
import { QuickAddFields } from './quick-add-fields';
import { SectionHeader } from './section-header';

export interface NuevoProductoScreenProps {
  readonly onSubmit: (input: CrearProductoInput) => void;
  readonly onBack: () => void;
  readonly submitting?: boolean;
  /** False when the plan has no stock (A-14). Defaults to true. */
  readonly stockEnabled?: boolean;
  readonly testID?: string;
}

export function NuevoProductoScreen(props: NuevoProductoScreenProps): ReactElement {
  const { t } = useTranslation();
  const form = useProductoForm();
  const handleSubmit = (): void => {
    const errors = validateProducto(form.state, validationMessages(t));
    form.setErrors(errors);
    if (Object.keys(errors).length > 0) return;
    props.onSubmit(buildProductoPayload(form.state));
    form.reset();
  };
  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
      testID={props.testID ?? 'nuevo-producto-screen'}
    >
      <SectionHeader label={t('nuevoProducto.title')} />
      <QuickAddFields form={form} stockEnabled={props.stockEnabled} />
      <Text fontFamily={typography.fontFamily} fontSize={fontSizes.sm} color={colors.gray600}>
        {t('nuevoProducto.portalHint')}
      </Text>
      <Btn
        variant="primary"
        onPress={handleSubmit}
        loading={props.submitting === true}
        fullWidth
        testID="producto-submit"
      >
        {t('nuevoProducto.save')}
      </Btn>
    </ScrollView>
  );
}
