/**
 * AppShell — the caja's frame (Track M, M-05; El Mostrador §10), around every
 * screen after sign-in:
 *
 * - under 760 px: the 64 px header, the screen, the four-tab bar (Inicio,
 *   Cobrar, Ventas, Mi turno);
 * - 760 to 1279 px: the 88 px icon rail, the 72 px top bar, the screen;
 * - from 1280 px: the full sidebar instead of the rail.
 *
 * The page is `gray200`. While the caja is offline an amber banner sits
 * under the header; it never blocks capture. Detail routes pass `onBack` and
 * get the way back in place of the caja badge (the web's `headerFor`).
 */

import type { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { View } from '@tamagui/core';
import { BottomTabBar, OfflineBanner, PathIcon } from '../../components/index';
import { useCloudSync } from '../../app/cloud-sync-bridge';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { AppMode } from '../../app-config/index';
import { EntitlementBanner } from '../../entitlement/entitlement-banner';
import type { AvisosSource } from './avisos-bell';
import { CajaHeader, CajaTopbar, type CajaHeaderProps, type HeaderStatus } from './caja-header';
import { NavRail, type NavMenuProps } from './nav-rail';
import { NavSidebar } from './nav-sidebar';
import { appTabs, navKeyFor, tabKeyFor, NAV, type NavKey } from './tab-definitions';
import { useCajaLayout, type CajaLayout } from './use-caja-layout';
import { useShellData, type ShellData } from './use-shell-data';

export interface AppShellProps {
  /** Which destination is current; a `NavKey`, or a path to derive it from. */
  readonly activeTabKey: string;
  /** Tabs, rail and sidebar items call this with the destination's path. */
  readonly onNavigate: (path: string) => void;
  /** Locks the caja so the next person signs in with their NIP. */
  readonly onLock?: () => void;
  /** @deprecated Use `onLock`. */
  readonly onSwitchOperator?: () => void;
  /** @deprecated The cog left the header; Ajustes opens from Mi turno. */
  readonly onOpenSettings?: () => void;
  /** The back button's label on a detail route («Mi turno», «Ventas»). */
  readonly title?: string;
  /** @deprecated The header no longer carries a subtitle. */
  readonly subtitle?: string;
  readonly mode: AppMode | null;
  readonly children: ReactNode;
  /** Present on a detail route: the header shows the way back. */
  readonly onBack?: () => void;
  /** The back button's accessible name when it says more than its label. */
  readonly backLabel?: string;
  /** The header's right side, per the web's `headerFor`. Defaults to `full`. */
  readonly headerStatus?: HeaderStatus;
  /** The avisos bell appears only when there is a count to show. */
  readonly avisos?: AvisosSource;
  /** Forces a frame regardless of the window (Storybook, tests). */
  readonly layout?: CajaLayout;
  readonly testID?: string;
}

const KNOWN: readonly string[] = Object.keys(NAV);

function activeOf(value: string): NavKey {
  return KNOWN.includes(value) ? (value as NavKey) : navKeyFor(value);
}

function useTabs(props: AppShellProps, active: NavKey) {
  const { t } = useTranslation();
  const current = tabKeyFor(active);
  return appTabs().map((tab) => ({
    key: tab.key,
    label: t(tab.labelKey),
    icon: (
      <PathIcon
        d={tab.icon}
        size={22}
        strokeWidth={tab.key === current ? 2.2 : 2}
        color={tab.key === current ? colors.black : colors.gray600}
      />
    ),
    onPress: () => props.onNavigate(tab.path),
    testID: `tab-${tab.key}`,
  }));
}

function Body({ children }: { children: ReactNode }): ReactElement {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <View flex={1}>{children}</View>
    </KeyboardAvoidingView>
  );
}

export interface AppShellFrameProps extends AppShellProps {
  readonly data: ShellData;
  readonly layout: CajaLayout;
  /** Strips under the header: the offline banner, the plan banner. */
  readonly banners?: ReactNode;
}

function useFrame(props: AppShellFrameProps) {
  const { t } = useTranslation();
  const { data } = props;
  const active = activeOf(props.activeTabKey);
  const back = props.onBack
    ? { label: props.title ?? t('shell.volver'), ariaLabel: props.backLabel, onPress: props.onBack }
    : undefined;
  const header: CajaHeaderProps = {
    data,
    back,
    status: props.headerStatus ?? 'full',
    avisos: props.avisos,
    onOpenPendientes: () => props.onNavigate('/pendientes'),
  };
  const menu: NavMenuProps = {
    activeKey: active,
    data,
    onNavigate: props.onNavigate,
    onLock: props.onLock ?? props.onSwitchOperator,
    onCloseTurno: () => props.onNavigate('/cierre'),
  };
  return { active, header, menu };
}

function OfflineSlot(): ReactElement | null {
  const { state } = useCloudSync();
  if (state.phase !== 'offline') return null;
  // The one «por enviar» count (DB3-CAJA-02): the pill's and Registros por enviar's.
  return <OfflineBanner pendientes={state.counts.unsent} />;
}

/** The frame itself, fed its data: what Storybook renders without a database. */
export function AppShellFrame(props: AppShellFrameProps): ReactElement {
  const { active, header, menu } = useFrame(props);
  const tabs = useTabs(props, active);
  const { layout } = props;
  const phone = layout === 'phone';
  return (
    <View
      testID={props.testID ?? 'app-shell'}
      flex={1}
      flexDirection="row"
      backgroundColor={colors.gray200}
    >
      {layout === 'rail' ? <NavRail {...menu} /> : null}
      {layout === 'sidebar' ? <NavSidebar {...menu} /> : null}
      <View flex={1} minWidth={0}>
        {phone ? <CajaHeader {...header} /> : <CajaTopbar {...header} />}
        {props.banners}
        <Body>{props.children}</Body>
        {phone ? <BottomTabBar items={tabs} activeKey={tabKeyFor(active)} /> : null}
      </View>
    </View>
  );
}

export function AppShell(props: AppShellProps): ReactElement {
  const measured = useCajaLayout();
  const data = useShellData();
  const banners = (
    <>
      <OfflineSlot />
      <EntitlementBanner />
    </>
  );
  return (
    <AppShellFrame {...props} data={data} layout={props.layout ?? measured} banners={banners} />
  );
}
