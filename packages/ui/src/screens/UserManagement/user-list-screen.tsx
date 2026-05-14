/**
 * UserListScreen — Director-only user management list.
 *
 * Shows all users with role badges. Director can create, edit, delete.
 */

import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { Pressable } from 'react-native';
import { Text, View } from '@tamagui/core';
import type { User } from '@cachink/domain';
import { Btn, Card, Icon, SafeAreaSpacer } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors, typography } from '../../theme';

export interface UserListScreenProps {
  readonly users: readonly User[];
  readonly onCreateUser: () => void;
  readonly onEditUser: (user: User) => void;
  readonly onDeleteUser: (user: User) => void;
  readonly testID?: string;
}

function UserRow(props: {
  readonly user: User;
  readonly onEdit: () => void;
  readonly onDelete: () => void;
}): ReactElement {
  const initial = props.user.nombre.charAt(0).toUpperCase();
  return (
    <Card variant="white" padding="md" fullWidth>
      <View flexDirection="row" alignItems="center" gap={12}>
        <View
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={props.user.avatarColor}
          alignItems="center"
          justifyContent="center"
        >
          <Text color={colors.white} fontWeight="bold" fontSize={18}>
            {initial}
          </Text>
        </View>
        <View flex={1}>
          <Text
            fontFamily={typography.fontFamily}
            fontWeight={typography.weights.bold}
            fontSize={15}
            color={colors.black}
          >
            {props.user.nombre}
          </Text>
          <Text fontFamily={typography.fontFamily} fontSize={12} color={colors.gray600}>
            {props.user.role === 'director' ? 'Director' : 'Operativo'}
          </Text>
        </View>
        <Pressable onPress={props.onEdit} testID={`user-edit-${props.user.id}`}>
          <Icon name="pencil" size={18} color={colors.gray600} />
        </Pressable>
        <Pressable onPress={props.onDelete} testID={`user-del-${props.user.id}`}>
          <Icon name="trash-2" size={18} color={colors.red} />
        </Pressable>
      </View>
    </Card>
  );
}

export function UserListScreen(props: UserListScreenProps): ReactElement {
  const { t } = useTranslation();
  return (
    <ScrollView
      testID={props.testID ?? 'user-list'}
      contentContainerStyle={{ padding: 16, gap: 12 }}
    >
      <SafeAreaSpacer />
      <View flexDirection="row" justifyContent="space-between" alignItems="center">
        <Text
          fontFamily={typography.fontFamily}
          fontWeight={typography.weights.black}
          fontSize={28}
          color={colors.black}
        >
          {t('userManagement.title')}
        </Text>
        <Btn variant="dark" size="sm" onPress={props.onCreateUser} testID="user-create-btn">
          {t('userManagement.create')}
        </Btn>
      </View>
      {props.users.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          onEdit={() => props.onEditUser(user)}
          onDelete={() => props.onDeleteUser(user)}
        />
      ))}
    </ScrollView>
  );
}
