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

function ToggleThumb({ enabled }: { enabled: boolean }): ReactElement {
  return (
    <View
      width={44}
      height={26}
      borderRadius={13}
      backgroundColor={enabled ? colors.yellow : colors.gray200}
      justifyContent="center"
      paddingHorizontal={2}
    >
      <View
        width={22}
        height={22}
        borderRadius={11}
        backgroundColor={colors.white}
        alignSelf={enabled ? 'flex-end' : 'flex-start'}
      />
    </View>
  );
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
        <ToggleThumb enabled={props.enabled} />
      </View>
    </Pressable>
  );
}

function usePaymentToggle(currentMethods: readonly PaymentMethod[]) {
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
  return { selected, toggle };
}

function MethodList(props: {
  readonly selected: Set<PaymentMethod>;
  readonly toggle: (key: PaymentMethod) => void;
}): ReactElement {
  return (
    <Card padding="none" fullWidth>
      {METHODS.map((m, i) => (
        <View key={m.key}>
          {i > 0 && <View height={1} backgroundColor={colors.gray100} />}
          <ToggleRow
            method={m}
            enabled={props.selected.has(m.key)}
            disabled={props.selected.size <= 1 && props.selected.has(m.key)}
            onToggle={() => props.toggle(m.key)}
          />
        </View>
      ))}
    </Card>
  );
}

function useSavePaymentMethods(selected: Set<PaymentMethod>) {
  const businessId = useCurrentBusinessId();
  const editar = useEditarBusiness();

  const handleSave = useCallback(() => {
    if (!businessId) return;
    const arr = METHODS.filter((m) => selected.has(m.key)).map((m) => m.key);
    editar.mutate({
      id: businessId as BusinessId,
      patch: { enabledPaymentMethods: JSON.stringify(arr) },
    });
  }, [businessId, selected, editar]);

  return { handleSave, isPending: editar.isPending };
}

function PaymentFooter(props: {
  readonly t: ReturnType<typeof useTranslation>['t'];
  readonly onSave: () => void;
  readonly isPending: boolean;
}): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.regular}
        fontSize={12}
        color={colors.gray400}
      >
        {props.t('tiposDePago.atLeastOne')}
      </Text>
      <Btn
        variant="primary"
        fullWidth
        size="lg"
        onPress={props.onSave}
        loading={props.isPending}
        testID="tipos-de-pago-save"
      >
        {props.t('tiposDePago.save')}
      </Btn>
    </>
  );
}

export function TiposDePagoScreen(props: TiposDePagoScreenProps): ReactElement {
  const { t } = useTranslation();
  const { selected, toggle } = usePaymentToggle(useEnabledPaymentMethods());
  const { handleSave, isPending } = useSavePaymentMethods(selected);

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
      <MethodList selected={selected} toggle={toggle} />
      <PaymentFooter t={t} onSave={handleSave} isPending={isPending} />
    </ScrollView>
  );
}
