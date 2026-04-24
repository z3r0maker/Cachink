/**
 * NuevoEgresoModal — single modal with 3 tabs (Gasto / Nómina /
 * Inventario), per ADR-020.
 *
 * Tab state is per-modal (resets on close). Each tab renders its own
 * form; submit routes to the tab's dedicated hook (useRegistrarEgreso
 * for Gasto, useRegistrarNomina for Nómina, useRegistrarInventarioPurchase
 * for Inventario — wired in Commits 3, 4, 5 respectively).
 *
 * This commit (C2) ships the scaffold + tab-switcher + placeholder tab
 * bodies. Forms land in the next three commits so each one can be
 * reviewed + tested in isolation.
 */

import { useState, type ReactElement, type ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Modal } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';

export type EgresoTab = 'gasto' | 'nomina' | 'inventario';

export interface NuevoEgresoModalProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly initialTab?: EgresoTab;
  readonly renderGastoTab?: (onDone: () => void) => ReactNode;
  readonly renderNominaTab?: (onDone: () => void) => ReactNode;
  readonly renderInventarioTab?: (onDone: () => void) => ReactNode;
  readonly testID?: string;
}

interface TabButtonProps {
  readonly id: EgresoTab;
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}

function TabButton({ id, label, active, onPress }: TabButtonProps): ReactElement {
  return (
    <View
      testID={`egreso-tab-${id}`}
      onPress={onPress}
      pressStyle={{ opacity: 0.7 }}
      backgroundColor={active ? colors.yellow : colors.white}
      borderColor={colors.black}
      borderWidth={2}
      borderRadius={radii[1]}
      paddingHorizontal={14}
      paddingVertical={8}
      cursor="pointer"
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.bold}
        fontSize={12}
        color={colors.black}
        letterSpacing={typography.letterSpacing.wide}
        style={{ textTransform: 'uppercase', userSelect: 'none' }}
      >
        {label}
      </Text>
    </View>
  );
}

interface TabBarProps {
  readonly active: EgresoTab;
  readonly onChange: (tab: EgresoTab) => void;
  readonly t: ReturnType<typeof useTranslation>['t'];
}

function TabBar({ active, onChange, t }: TabBarProps): ReactElement {
  return (
    <View flexDirection="row" gap={8} marginBottom={12}>
      <TabButton
        id="gasto"
        label={t('nuevoEgreso.tabGasto')}
        active={active === 'gasto'}
        onPress={() => onChange('gasto')}
      />
      <TabButton
        id="nomina"
        label={t('nuevoEgreso.tabNomina')}
        active={active === 'nomina'}
        onPress={() => onChange('nomina')}
      />
      <TabButton
        id="inventario"
        label={t('nuevoEgreso.tabInventario')}
        active={active === 'inventario'}
        onPress={() => onChange('inventario')}
      />
    </View>
  );
}

function PlaceholderBody({ tab }: { tab: EgresoTab }): ReactElement {
  return (
    <View testID={`egreso-tab-body-${tab}`} padding={16}>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
      >
        Tab: {tab}
      </Text>
    </View>
  );
}

export function NuevoEgresoModal(props: NuevoEgresoModalProps): ReactElement {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<EgresoTab>(props.initialTab ?? 'gasto');

  const body = ((): ReactNode => {
    if (activeTab === 'gasto')
      return props.renderGastoTab?.(props.onClose) ?? <PlaceholderBody tab="gasto" />;
    if (activeTab === 'nomina')
      return props.renderNominaTab?.(props.onClose) ?? <PlaceholderBody tab="nomina" />;
    return props.renderInventarioTab?.(props.onClose) ?? <PlaceholderBody tab="inventario" />;
  })();

  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
      title={t('nuevoEgreso.title')}
      testID={props.testID ?? 'nuevo-egreso-modal'}
    >
      <TabBar active={activeTab} onChange={setActiveTab} t={t} />
      {body}
      <View marginTop={12}>
        <Btn variant="ghost" onPress={props.onClose} fullWidth testID="nuevo-egreso-cancel">
          {t('actions.cancel')}
        </Btn>
      </View>
    </Modal>
  );
}
