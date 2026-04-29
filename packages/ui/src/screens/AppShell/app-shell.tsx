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
import { Platform } from 'react-native';
import { View } from '@tamagui/core';
import { KeyboardAvoidingView } from 'react-native';
import { BottomTabBar, Btn, Icon, TopBar } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { AppMode, Role } from '../../app-config/index';
import { tabsForRole } from './tab-definitions';
import { SyncStatusBadge } from './sync-status-badge';
import { useLanSync } from '../../hooks/use-lan-sync';
import { BackButton, RoleAvatar } from './app-shell-left-slot';

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
  /**
   * Optional source string for the TopBar's left avatar. Operativo
   * passes the business name (`'Panadería La Esquina'` → `'PA'`),
   * Director passes the role abbreviation (`'DIR'`). Falls back to
   * the localised role label when omitted.
   *
   * Per ADR-040 the legacy `RoleChip` + "Cambiar" Btn collapsed into
   * a single tappable `<InitialsAvatar>`; tapping the avatar fires
   * `onChangeRole`.
   */
  readonly avatarValue?: string;
  /**
   * Audit M-1 follow-up (UI-AUDIT-1, Issue 2): when provided, the
   * TopBar's left slot renders a ghost icon-only back button (chevron)
   * **instead of** the role avatar. Used on routes reached from a
   * parent screen — Settings, Cuentas por Cobrar, etc. — so the user
   * has a clear way to return where they came from.
   *
   * The role avatar's "Cambiar" affordance is still reachable from the
   * Settings screen body, so collapsing it from the TopBar on detail
   * pages doesn't lose discoverability.
   */
  readonly onBack?: () => void;
  /**
   * Optional override for the back-button's accessible label. Defaults
   * to `topBar.back` ("Atrás"). Pass when a route wants a more specific
   * SR-friendly label (e.g. "Volver a Inicio").
   */
  readonly backLabel?: string;
  readonly testID?: string;
}

interface RightSlotProps {
  readonly mode: AppMode | null;
  readonly onOpenSettings: () => void;
}

function RightSlot(props: RightSlotProps): ReactElement {
  const { t } = useTranslation();
  const lan = useLanSync();
  return (
    <View flexDirection="row" alignItems="center" gap={8}>
      <SyncStatusBadge
        mode={props.mode}
        lanStatus={lan.status}
        connectedDevices={lan.connectedDevices}
        onRetry={
          props.mode === 'lan-server' || props.mode === 'lan-client'
            ? () => void lan.retryNow()
            : undefined
        }
      />
      {/*
       * Audit 3.11 + 3.12 — Btn now accepts an icon-only configuration
       * (children optional when icon is set, see PR 2.5). The ariaLabel
       * was hardcoded "Ajustes" which violates CLAUDE.md §8.5
       * (no hardcoded user-facing strings); pulled into the
       * `topBar.openSettings` i18n key.
       */}
      <Btn
        variant="ghost"
        size="sm"
        onPress={props.onOpenSettings}
        testID="top-bar-open-settings"
        ariaLabel={t('topBar.openSettings')}
        icon={<Icon name="settings" size={20} color={colors.black} />}
      />
    </View>
  );
}

function useLeftSlot(props: AppShellProps, t: ReturnType<typeof useTranslation>['t']): ReactElement {
  const avatarValue = props.avatarValue ?? t(`roles.${props.role}` as const);
  const backLabel = props.backLabel ?? t('topBar.back');
  if (props.onBack !== undefined) {
    return <BackButton onPress={props.onBack} ariaLabel={backLabel} />;
  }
  return (
    <RoleAvatar
      role={props.role}
      value={avatarValue}
      onChange={props.onChangeRole}
      ariaLabel={t('topBar.cambiarRol')}
    />
  );
}

export function AppShell(props: AppShellProps): ReactElement {
  const { t } = useTranslation();
  const tabs = tabsForRole(props.role);
  const items = tabs.map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey as 'tabs.ventas'),
    icon: <Icon name={tab.icon} size={22} color={colors.black} />,
    onPress: () => props.onNavigate(tab.path),
    testID: `tab-${tab.key}`,
  }));
  const leftSlot = useLeftSlot(props, t);

  return (
    <View testID={props.testID ?? 'app-shell'} flex={1} backgroundColor={colors.offwhite}>
      <TopBar
        title={props.title}
        subtitle={props.subtitle}
        left={leftSlot}
        right={<RightSlot mode={props.mode} onOpenSettings={props.onOpenSettings} />}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View flex={1}>{props.children}</View>
      </KeyboardAvoidingView>
      <BottomTabBar items={items} activeKey={props.activeTabKey} />
    </View>
  );
}
