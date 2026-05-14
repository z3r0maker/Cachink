/**
 * SettingsHub — the top-level Ajustes screen, showing 4 navigable
 * category cards: Negocio, Tasas ISR, Empleados, and Sistema.
 *
 * Tapping a card calls `onNavigate(section)` so the shell can push
 * the appropriate sub-screen.
 */

import type { ReactElement } from 'react';
import { Pressable, ScrollView } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { Business } from '@cachink/domain';
import { Card, Icon, SectionTitle } from '../../components/index';
import type { IconName } from '../../components/Icon/icon.shared';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export type SettingsSection = 'negocio' | 'tasas-isr' | 'empleados' | 'sistema';

export interface SettingsHubProps {
  readonly business: Business | null;
  readonly empleadoCount: number;
  readonly onNavigate: (section: SettingsSection) => void;
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
              fontSize={16}
              color={colors.black}
            >
              {props.title}
            </Text>
            <Text
              fontFamily={typography.fontFamily}
              fontWeight={typography.weights.medium}
              fontSize={13}
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

function cat(section: SettingsSection, icon: IconName, title: string, subtitle: string): HubCategory {
  return { section, icon, title, subtitle, testID: `settings-hub-${section}` };
}

export function SettingsHub(props: SettingsHubProps): ReactElement {
  const { t } = useTranslation();
  const businessName = props.business?.nombre ?? t('settings.negocioNoConfigurado');
  const count = String(props.empleadoCount);
  const empleadosSubtitle = t('settings.empleadosSubtitle').replace('{count}', count);
  const categories: HubCategory[] = [
    cat('negocio', 'building-2', t('settings.negocioCard'), businessName),
    cat('tasas-isr', 'banknote', t('settings.tasasIsrCard'), t('settings.tasasIsrSubtitle')),
    cat('empleados', 'users', t('settings.empleadosCard'), empleadosSubtitle),
    cat('sistema', 'settings', t('settings.sistemaCard'), t('settings.sistemaSubtitle')),
  ];
  return (
    <ScrollView
      testID={props.testID ?? 'settings-hub-screen'}
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
    </ScrollView>
  );
}
