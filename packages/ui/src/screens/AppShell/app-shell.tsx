/**
 * AppShell — the sticky chrome wrapping every post-wizard screen
 * (P1C-M1-T02, T03).
 *
 * Layout: TopBar (role chip + title + settings cog + sync badge) →
 * children → BottomTabBar (3 tabs for Operativo, 6 for Director). The
 * tab list is picked via `tabsForRole` per CLAUDE.md §1.
 *
 * Consumers (both app-shell route wrappers) pass:
 *   - role + activeTabKey — drive which tab set is rendered + which is
 *     active.
 *   - onNavigate(path) — called when a tab is tapped. The app-shell
 *     route wrapper plugs Expo Router / wouter here.
 *   - onChangeRole — called when "Cambiar" is tapped. Typically clears
 *     the role in Zustand and routes to `/role-picker`.
 *   - onOpenSettings — called when the settings cog is tapped.
 *   - title / subtitle — current screen's title.
 *   - mode — drives the sync-state badge; local-standalone renders none.
 */

import type { ReactElement, ReactNode } from 'react';
import { Text, View } from '@tamagui/core';
import { BottomTabBar, Btn, TopBar } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, radii, typography } from '../../theme';
import type { AppMode, Role } from '../../app-config/index';
import { tabsForRole } from './tab-definitions';
import { SyncStatusBadge } from './sync-status-badge';

export interface AppShellProps {
  readonly role: Role;
  readonly activeTabKey: string;
  readonly onNavigate: (path: string) => void;
  readonly onChangeRole: () => void;
  readonly onOpenSettings: () => void;
  readonly title?: string;
  readonly subtitle?: string;
  readonly mode: AppMode | null;
  readonly children: ReactNode;
  readonly testID?: string;
}

interface RoleChipProps {
  readonly role: Role;
  readonly onChange: () => void;
  readonly changeLabel: string;
}

function RoleChip(props: RoleChipProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <View
        testID="top-bar-role-chip"
        backgroundColor={props.role === 'director' ? colors.black : colors.yellow}
        borderColor={colors.black}
        borderWidth={2}
        borderRadius={radii[0]}
        paddingHorizontal={10}
        paddingVertical={4}
      >
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.bold}
          fontSize={11}
          color={props.role === 'director' ? colors.yellow : colors.black}
          letterSpacing={typography.letterSpacing.wide}
          style={{ textTransform: 'uppercase' }}
        >
          {t(`roles.${props.role}` as const)}
        </Text>
      </View>
      <Btn variant="ghost" size="sm" onPress={props.onChange} testID="top-bar-change-role">
        {props.changeLabel}
      </Btn>
    </View>
  );
}

interface RightSlotProps {
  readonly mode: AppMode | null;
  readonly onOpenSettings: () => void;
}

function RightSlot(props: RightSlotProps): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <SyncStatusBadge mode={props.mode} />
      <Btn variant="ghost" size="sm" onPress={props.onOpenSettings} testID="top-bar-open-settings">
        ⚙️
      </Btn>
    </View>
  );
}

export function AppShell(props: AppShellProps): ReactElement {
  const { t } = useTranslation();
  const tabs = tabsForRole(props.role);
  const items = tabs.map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey as 'tabs.ventas'),
    icon: tab.icon,
    onPress: () => props.onNavigate(tab.path),
    testID: `tab-${tab.key}`,
  }));

  return (
    <View testID={props.testID ?? 'app-shell'} flex={1} backgroundColor={colors.offwhite}>
      <TopBar
        title={props.title}
        subtitle={props.subtitle}
        left={
          <RoleChip
            role={props.role}
            onChange={props.onChangeRole}
            changeLabel={t('topBar.cambiarRol')}
          />
        }
        right={<RightSlot mode={props.mode} onOpenSettings={props.onOpenSettings} />}
      />
      <View flex={1}>{props.children}</View>
      <BottomTabBar items={items} activeKey={props.activeTabKey} />
    </View>
  );
}
