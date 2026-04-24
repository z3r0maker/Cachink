/**
 * RolePicker — the post-wizard, pre-home screen (P1C-M1-T01).
 *
 * Role is a session attribute (not persisted), selected every time the
 * tablet boots or a user taps "Cambiar" in the TopBar. Two tappable
 * cards:
 *   - OPERATIVO (ghost / neutral card) — captures ventas, egresos,
 *     inventory per CLAUDE.md §1.
 *   - DIRECTOR (dark card) — sees Estados Financieros, Indicadores, and
 *     the Director Home dashboard.
 *
 * Presentation-only: the only prop is `onSelect`, which the app-shell
 * route wires to `useSetRole()` + `router.replace('/home')`. That split
 * keeps the screen testable in isolation — no navigation harness.
 */

import type { ReactElement } from 'react';
import { Text, View } from '@tamagui/core';
import { Btn, Card } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import type { Role } from '../../app-config/index';
import { colors, typography } from '../../theme';

export interface RolePickerProps {
  /** Fires with the selected role. Wire to `useSetRole()` + router. */
  readonly onSelect: (role: Role) => void;
  /** Forwarded to the root View so E2E tests can anchor to it. */
  readonly testID?: string;
}

interface RoleCardProps {
  readonly role: Role;
  readonly label: string;
  readonly hint: string;
  readonly testID: string;
  readonly onPress: () => void;
}

function RoleCard(props: RoleCardProps): ReactElement {
  const isDark = props.role === 'director';
  return (
    <Card testID={props.testID} variant={isDark ? 'black' : 'white'} padding="lg" fullWidth>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={28}
        letterSpacing={typography.letterSpacing.tighter}
        color={isDark ? colors.yellow : colors.black}
        style={{ textTransform: 'uppercase' }}
      >
        {props.label}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.medium}
        fontSize={14}
        color={isDark ? colors.white : colors.gray600}
        marginTop={6}
      >
        {props.hint}
      </Text>
      <View marginTop={16}>
        <Btn
          variant={isDark ? 'primary' : 'dark'}
          onPress={props.onPress}
          fullWidth
          testID={`${props.testID}-select`}
        >
          {props.label}
        </Btn>
      </View>
    </Card>
  );
}

function Header({ title, subtitle }: { title: string; subtitle: string }): ReactElement {
  return (
    <>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.black}
        fontSize={48}
        letterSpacing={typography.letterSpacing.tightest}
        color={colors.black}
      >
        {title}
      </Text>
      <Text
        fontFamily={typography.fontFamily}
        fontWeight={typography.weights.semibold}
        fontSize={18}
        color={colors.gray600}
        marginBottom={16}
      >
        {subtitle}
      </Text>
    </>
  );
}

export function RolePicker(props: RolePickerProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      testID={props.testID ?? 'role-picker'}
      flex={1}
      backgroundColor={colors.offwhite}
      alignItems="center"
      justifyContent="center"
      padding={24}
      gap={20}
    >
      <Header title={t('rolePicker.title')} subtitle={t('rolePicker.subtitle')} />
      <View width="100%" maxWidth={480} gap={16}>
        <RoleCard
          role="operativo"
          label={t('roles.operativo')}
          hint={t('rolePicker.operativoHint')}
          testID="role-operativo"
          onPress={() => props.onSelect('operativo')}
        />
        <RoleCard
          role="director"
          label={t('roles.director')}
          hint={t('rolePicker.directorHint')}
          testID="role-director"
          onPress={() => props.onSelect('director')}
        />
      </View>
    </View>
  );
}
