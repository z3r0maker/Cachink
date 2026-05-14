/**
 * QuickSwitchScreen — user avatar grid for fast user switching.
 *
 * Replaces the old RolePicker. Displays all non-deleted users for the
 * current business as tappable avatar circles (first letter + color).
 * Tapping an avatar opens a PIN prompt inline.
 *
 * Phase 1 of the Feature Flags plan: user management + auth.
 * ADR-049: PIN for daily login.
 */

import { useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { User, UserId } from '@cachink/domain';
import { FloatingCoinsBackground, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';
import { PinPrompt } from './pin-prompt';

export interface QuickSwitchScreenProps {
  readonly users: readonly User[];
  readonly onAuthenticate: (userId: UserId, pin: string) => void;
  readonly onForgotPin?: (userId: UserId) => void;
  readonly error: string | null;
  readonly submitting: boolean;
  readonly testID?: string;
}

type T = ReturnType<typeof useTranslation>['t'];

function AvatarCircle({ initial, bg }: { initial: string; bg: string }): ReactElement {
  return (
    <View
      alignItems="center"
      justifyContent="center"
      width={72}
      height={72}
      borderRadius={36}
      backgroundColor={bg}
      marginBottom={8}
    >
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        color={colors.white}
      >
        {initial}
      </Text>
    </View>
  );
}

function UserAvatar(props: {
  readonly user: User;
  readonly onPress: () => void;
  readonly selected: boolean;
}): ReactElement {
  const initial = props.user.nombre.charAt(0).toUpperCase();
  const bg = props.selected ? colors.black : props.user.avatarColor;
  return (
    <Pressable onPress={props.onPress} testID={`user-avatar-${props.user.id}`}>
      <AvatarCircle initial={initial} bg={bg} />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={13}
        color={colors.gray600}
        textAlign="center"
        numberOfLines={1}
        width={80}
      >
        {props.user.nombre}
      </Text>
    </Pressable>
  );
}

function QuickSwitchHeader({ t }: { t: T }): ReactElement {
  return (
    <>
      <SafeAreaSpacer />
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={36}
        letterSpacing={-1}
        color={colors.black}
      >
        {t('login.title')}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={16}
        color={colors.gray600}
      >
        {t('login.selectUser')}
      </Text>
    </>
  );
}

function UserAvatarGrid({
  users,
  selectedUserId,
  onSelect,
}: {
  users: readonly User[];
  selectedUserId: UserId | null;
  onSelect: (id: UserId) => void;
}): ReactElement {
  return (
    <View flexDirection="row" flexWrap="wrap" justifyContent="center" gap={20} maxWidth={400}>
      {users.map((user) => (
        <UserAvatar
          key={user.id}
          user={user}
          selected={selectedUserId === user.id}
          onPress={() => onSelect(user.id)}
        />
      ))}
    </View>
  );
}

export function QuickSwitchScreen(props: QuickSwitchScreenProps): ReactElement {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState<UserId | null>(null);
  const selectedName = props.users.find((u) => u.id === selectedUserId)?.nombre ?? '';
  return (
    <FloatingCoinsBackground testID={props.testID ?? 'quick-switch'}>
      <View flex={1} alignItems="center" justifyContent="center" padding={24} gap={24}>
        <QuickSwitchHeader t={t} />
        <UserAvatarGrid
          users={props.users}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
        />
        {selectedUserId !== null && (
          <PinPrompt
            userId={selectedUserId}
            userName={selectedName}
            onSubmit={(pin) => props.onAuthenticate(selectedUserId, pin)}
            onForgotPin={props.onForgotPin ? () => props.onForgotPin!(selectedUserId) : undefined}
            error={props.error}
            submitting={props.submitting}
          />
        )}
      </View>
    </FloatingCoinsBackground>
  );
}
