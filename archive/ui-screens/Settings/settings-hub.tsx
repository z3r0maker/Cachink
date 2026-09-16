/**
 * SettingsHub — the top-level Ajustes screen, showing 3 navigable
 * category cards: Negocio, Tasas ISR, and Sistema.
 *
 * Empleados moved to the Otros grid (top-level route) — see plan
 * "Move Empleados from Settings to Otros".
 *
 * Tapping a card calls `onNavigate(section)` so the shell can push
 * the appropriate sub-screen.
 */

import type { ReactElement } from 'react';
import { Pressable, ScrollView, View as RNView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { Business } from '@xangarro/domain';
import { Card, Icon, SectionTitle } from '../../components/index';
import type { IconName } from '../../components/Icon/icon.shared';
import { useTranslation } from '../../i18n/index';
import { colors, fontSizes, typography } from '../../theme';

export type SettingsSection = 'negocio' | 'tasas-isr' | 'sistema' | 'tipos-de-pago' | 'indicadores';

export interface SettingsHubProps {
  readonly business: Business | null;
  readonly onNavigate: (section: SettingsSection) => void;
  /**
   * Slot rendered at the end of the hub. Used by the app shell to inject
   * `__DEV__`-only actions (demo seed / reset), mirroring `OtrosScreen`'s
   * `footer`. Configuración is where those have to live now: review item
   * #7 removed the "Otros" tab from both bars, which left
   * `(tabs)/otros.tsx` — and the dev actions it hosted — unreachable.
   */
  readonly footer?: ReactElement | null;
  readonly testID?: string;
}

interface CategoryCardProps {
  readonly icon: IconName;
  readonly title: string;
  readonly subtitle: string;
  readonly onPress: () => void;
  readonly testID: string;
}

function CategoryCard(props: CategoryCardProps): ReactElement {
  return (
    <Pressable onPress={props.onPress} testID={props.testID}>
      <Card padding="md" fullWidth>
        <View flexDirection="row" alignItems="center" gap={12}>
          <Icon name={props.icon} size={22} color={colors.blue} />
          <View flex={1}>
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.semibold}
              fontSize={fontSizes.lg}
              color={colors.black}
            >
              {props.title}
            </Text>
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium}
              fontSize={fontSizes.sm}
              color={colors.gray600}
              marginTop={2}
            >
              {props.subtitle}
            </Text>
          </View>
          <Icon name="chevron-right" size={18} color={colors.gray600} />
        </View>
      </Card>
    </Pressable>
  );
}

interface HubCategory {
  readonly section: SettingsSection;
  readonly icon: IconName;
  readonly title: string;
  readonly subtitle: string;
  readonly testID: string;
}

function cat(
  section: SettingsSection,
  icon: IconName,
  title: string,
  subtitle: string,
): HubCategory {
  return { section, icon, title, subtitle, testID: `settings-hub-${section}` };
}

type T = ReturnType<typeof useTranslation>['t'];

/**
 * Device-only settings (ADR-053 §3): business profile, ISR, tipos de pago and
 * indicadores are tenant data managed in the portal. A-12 reshapes this hub.
 */
function buildCategories(t: T): HubCategory[] {
  return [cat('sistema', 'settings', t('settings.sistemaCard'), t('settings.sistemaSubtitle'))];
}

export function SettingsHub(props: SettingsHubProps): ReactElement {
  const { t } = useTranslation();
  const categories = buildCategories(t);
  return (
    <RNView testID={props.testID ?? 'settings-hub-screen'} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.offwhite }}
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 24 }}
      >
        <SectionTitle title={t('settings.hubTitle')} />
        {categories.map((c) => (
          <CategoryCard
            key={c.section}
            icon={c.icon}
            title={c.title}
            subtitle={c.subtitle}
            onPress={() => props.onNavigate(c.section)}
            testID={c.testID}
          />
        ))}
        {props.footer}
      </ScrollView>
    </RNView>
  );
}
