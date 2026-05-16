/**
 * TiposDePagoScreen — toggle which payment methods the business accepts.
 *
 * Each method gets a row with icon + label + Switch. At least one
 * method must remain active (last-standing toggle is disabled).
 * Save writes the JSON array to `Business.enabledPaymentMethods`.
 */
import { useState, useCallback, type ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { BusinessId, PaymentMethod } from '@cachink/domain';
import { Btn, Card, Icon, SectionTitle } from '../../components/index';
import type { IconName } from '../../components/Icon/icon.shared';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { impactLight } from '../../haptics/index';
import { useEnabledPaymentMethods } from '../../hooks/use-enabled-payment-methods';
import { useEditarBusiness } from '../../hooks/use-editar-business';
import { useCurrentBusinessId } from '../../app-config/index';

interface MethodRow {
  readonly key: PaymentMethod;
  readonly icon: IconName;
  readonly label: string;
}

const METHODS: readonly MethodRow[] = [
  { key: 'Efectivo', icon: 'banknote', label: 'Efectivo' },
  { key: 'Transferencia', icon: 'wallet', label: 'Transferencia' },
  { key: 'Tarjeta', icon: 'credit-card', label: 'Tarjeta' },
  { key: 'QR/CoDi', icon: 'smartphone', label: 'QR/CoDi' },
] as const;

export interface TiposDePagoScreenProps {
  readonly testID?: string;
}

function ToggleRow(props: {
  readonly method: MethodRow;
  readonly enabled: boolean;
  readonly disabled: boolean;
  readonly onToggle: () => void;
}): ReactElement {
  return (
    <Pressable
      onPress={props.disabled ? undefined : props.onToggle}
      testID={`toggle-${props.method.key}`}
      accessibilityRole="switch"
      accessibilityState={{ checked: props.enabled, disabled: props.disabled }}
    >
      <View
        flexDirection="row"
        alignItems="center"
        paddingVertical={14}
        paddingHorizontal={16}
        gap={12}
        opacity={props.disabled ? 0.5 : 1}
      >
        <Icon name={props.method.icon} size={22} color={colors.black} />
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.semibold}
          fontSize={15}
          color={colors.black}
          flex={1}
        >
          {props.method.label}
        </Text>
        <View
          width={44}
          height={26}
          borderRadius={13}
          backgroundColor={props.enabled ? colors.black : colors.gray200}
          justifyContent="center"
          paddingHorizontal={2}
        >
          <View
            width={22}
            height={22}
            borderRadius={11}
            backgroundColor={colors.white}
            alignSelf={props.enabled ? 'flex-end' : 'flex-start'}
          />
        </View>
      </View>
    </Pressable>
  );
}

export function TiposDePagoScreen(props: TiposDePagoScreenProps): ReactElement {
  const { t } = useTranslation();
  const businessId = useCurrentBusinessId();
  const currentMethods = useEnabledPaymentMethods();
  const editar = useEditarBusiness();

  const [selected, setSelected] = useState<Set<PaymentMethod>>(
    () => new Set(currentMethods),
  );

  const toggle = useCallback((key: PaymentMethod) => {
    impactLight();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleSave = useCallback(() => {
    if (!businessId) return;
    const arr = METHODS.filter((m) => selected.has(m.key)).map((m) => m.key);
    editar.mutate({
      id: businessId as BusinessId,
      patch: { enabledPaymentMethods: JSON.stringify(arr) },
    });
  }, [businessId, selected, editar]);

  return (
    <ScrollView
      testID={props.testID ?? 'tipos-de-pago-screen'}
      style={{ flex: 1, backgroundColor: colors.offwhite }}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
    >
      <SectionTitle title={t('tiposDePago.title')} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={colors.gray600}
      >
        {t('tiposDePago.description')}
      </Text>
      <Card padding="none" fullWidth>
        {METHODS.map((m, i) => (
          <View key={m.key}>
            {i > 0 && <View height={1} backgroundColor={colors.gray100} />}
            <ToggleRow
              method={m}
              enabled={selected.has(m.key)}
              disabled={selected.size <= 1 && selected.has(m.key)}
              onToggle={() => toggle(m.key)}
            />
          </View>
        ))}
      </Card>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.regular}
        fontSize={12}
        color={colors.gray400}
      >
        ⓘ {t('tiposDePago.atLeastOne')}
      </Text>
      <Btn
        variant="primary"
        fullWidth
        size="lg"
        onPress={handleSave}
        loading={editar.isPending}
        testID="tipos-de-pago-save"
      >
        {t('tiposDePago.save')}
      </Btn>
    </ScrollView>
  );
}
