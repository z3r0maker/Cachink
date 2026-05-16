/**
 * UserAvatar — animated avatar circle with role badge for QuickSwitch.
 *
 * Visual features:
 *   - Fade unselected avatars to 45% opacity
 *   - Spring-scale selected avatar to 1.1×
 *   - Hero mode: selected circle grows from 72px → 88px
 *   - Role badge (Tag pill) below the name
 *   - 2-line name support (100px width)
 */

import type { ReactElement } from 'react';
import { Animated, Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { User, UserId } from '@cachink/domain';
import { Tag } from '../../components/index';
import { colors, typography } from '../../theme';
import { useAvatarFade, useAvatarScale } from './login-animations';

/** Map avatarColor domain strings → valid theme hex values. */
const AVATAR_COLOR_MAP: Record<string, string> = {
  blue: colors.blue,
  green: colors.green,
  red: colors.red,
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  slate: colors.gray600,
};

function resolveAvatarColor(raw: string): string {
  return AVATAR_COLOR_MAP[raw] ?? colors.blue;
}

const SIZE_DEFAULT = 72;
const SIZE_HERO = 88;
const FONT_DEFAULT = 28;
const FONT_HERO = 34;

function AvatarCircle({ initial, bg, large }: { initial: string; bg: string; large?: boolean }): ReactElement {
  const size = large ? SIZE_HERO : SIZE_DEFAULT;
  return (
    <View
      alignItems="center"
      justifyContent="center"
      width={size}
      height={size}
      borderRadius={size / 2}
      backgroundColor={resolveAvatarColor(bg)}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={large ? FONT_HERO : FONT_DEFAULT}
        color={colors.white}
      >
        {initial}
      </Text>
    </View>
  );
}

function AvatarRing({ selected, children }: { selected: boolean; children: ReactElement }): ReactElement {
  return (
    <View
      alignItems="center"
      justifyContent="center"
      width={selected ? 96 : 100}
      height={selected ? 96 : 80}
      borderRadius={selected ? 48 : 40}
      borderWidth={selected ? 3 : 0}
      borderColor={selected ? colors.yellow : 'transparent'}
    >
      {children}
    </View>
  );
}

function AvatarContent(props: { user: User; selected: boolean }): ReactElement {
  const initial = props.user.nombre.charAt(0).toUpperCase();
  const isDirector = props.user.role === 'director';

  return (
    <View alignItems="center" gap={4}>
      <AvatarRing selected={props.selected}>
        <AvatarCircle initial={initial} bg={props.user.avatarColor} large={props.selected} />
      </AvatarRing>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
        textAlign="center"
        numberOfLines={2}
        width={100}
      >
        {props.user.nombre}
      </Text>
      <View alignItems="center">
        <Tag variant={isDirector ? 'info' : 'neutral'} testID={`user-role-${props.user.id}`}>
          {isDirector ? 'Director' : 'Operativo'}
        </Tag>
      </View>
    </View>
  );
}

export function UserAvatar(props: {
  readonly user: User;
  readonly onPress: () => void;
  readonly selected: boolean;
  readonly anySelected: boolean;
}): ReactElement {
  const fade = useAvatarFade(props.selected, props.anySelected);
  const scale = useAvatarScale(props.selected);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ scale }] }}>
      <Pressable onPress={props.onPress} testID={`user-avatar-${props.user.id}`}>
        <AvatarContent user={props.user} selected={props.selected} />
      </Pressable>
    </Animated.View>
  );
}

export function UserAvatarGrid({
  users,
  selectedUserId,
  onSelect,
}: {
  users: readonly User[];
  selectedUserId: UserId | null;
  onSelect: (id: UserId) => void;
}): ReactElement {
  const anySelected = selectedUserId !== null;
  return (
    <View flexDirection="row" flexWrap="wrap" justifyContent="center" gap={20} maxWidth={400}>
      {users.map((user) => (
        <UserAvatar
          key={user.id}
          user={user}
          selected={selectedUserId === user.id}
          anySelected={anySelected}
          onPress={() => onSelect(user.id)}
        />
      ))}
    </View>
  );
}
