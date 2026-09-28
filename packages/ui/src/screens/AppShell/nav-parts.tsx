/**
 * What the rail and the sidebar share: the menu's props, one destination
 * (a column of glyph over label on the rail, a row on the sidebar; the
 * current one yellow with the black edge and the small shadow, like the web
 * sidebar's `navItem`), the turno dot, and the grouped list itself.
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { navGroups, type NavGroup, type NavKey, type TabDefinition } from './tab-definitions';
import type { ShellData } from './use-shell-data';

export interface NavMenuProps {
  readonly activeKey: NavKey;
  readonly data: ShellData;
  readonly onNavigate: (path: string) => void;
  readonly onLock?: () => void;
  /** «Cerrar mi turno»: opens Mi turno, where the cierre starts. */
  readonly onCloseTurno: () => void;
}

export type MenuKind = 'rail' | 'sidebar';

function itemStyle(active: boolean, kind: MenuKind): ViewStyle {
  const shape: ViewStyle =
    kind === 'rail'
      ? { width: 72, minHeight: 54, paddingVertical: 6, justifyContent: 'center', gap: 4 }
      : { height: 46, flexDirection: 'row', gap: 12, paddingHorizontal: 12 };
  return {
    ...shape,
    alignItems: 'center',
    borderRadius: radii[3],
    borderWidth: borderWidths.thin,
    borderColor: active ? colors.black : 'transparent',
    backgroundColor: active ? colors.yellow : 'transparent',
    boxShadow: active ? shadows.small : undefined,
  };
}

function NavItem(p: {
  item: TabDefinition;
  active: boolean;
  kind: MenuKind;
  onPress: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const label = t(p.item.labelKey);
  const rail = p.kind === 'rail';
  return (
    <Pressable
      testID={`${p.kind}-${p.item.key}`}
      role="link"
      aria-label={label}
      aria-current={p.active ? 'page' : undefined}
      onPress={p.onPress}
      style={itemStyle(p.active, p.kind)}
    >
      <PathIcon d={p.item.icon} size={22} strokeWidth={p.active ? 2.2 : 2} />
      <MText
        textAlign={rail ? 'center' : undefined}
        size={rail ? 'xs' : 'body'}
        weight={p.active ? 'extraBold' : 'bold'}
        color={rail && !p.active ? colors.gray600 : colors.black}
      >
        {label}
      </MText>
    </Pressable>
  );
}

export function TurnoDot(props: {
  readonly abierto: boolean;
  readonly label?: string;
}): ReactElement {
  return (
    <View
      width={10}
      height={10}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={props.abierto ? colors.green : colors.gray400}
      aria-label={props.label}
    />
  );
}

function Group(p: NavMenuProps & { group: NavGroup; kind: MenuKind }): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      gap={p.kind === 'rail' ? 4 : 5}
      role="group"
      aria-label={p.group.labelKey ? t(p.group.labelKey) : undefined}
    >
      {p.group.items.map((item) => (
        <NavItem
          key={item.key}
          item={item}
          kind={p.kind}
          active={item.key === p.activeKey}
          onPress={() => p.onNavigate(item.path)}
        />
      ))}
    </View>
  );
}

/** The grouped destinations; `divider` draws what goes between groups. */
export function NavGroups(
  p: NavMenuProps & { kind: MenuKind; divider: (g: NavGroup, i: number) => ReactElement | null },
): ReactElement {
  return (
    <>
      {navGroups().map((group, i) => (
        <View
          key={group.labelKey ?? 'top'}
          alignItems={p.kind === 'rail' ? 'center' : undefined}
          gap={p.kind === 'rail' ? 10 : 4}
        >
          {p.divider(group, i)}
          <Group {...p} group={group} />
        </View>
      ))}
    </>
  );
}
