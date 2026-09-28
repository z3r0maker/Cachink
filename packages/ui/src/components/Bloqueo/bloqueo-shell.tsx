/**
 * BloqueoShell — the frame of the locked caja (MvBloqueo; the web caja's
 * `BloqueoCaja`): a yellow head with the lock in a white circle, the caja and
 * the business as an eyebrow, «Caja bloqueada», and a card for whoever holds
 * the turno; below it, on the page, whatever unlocks (the NIP pad, M-06).
 *
 * Full screen: no header, no tab bar. The lock pops in and only fades under
 * Reduce Motion. The caja and business names come from the session; the
 * shell never invents one (§11).
 */
import type { ReactElement, ReactNode } from 'react';
import { Animated, ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { useTranslation } from '../../i18n/index';
import { useEnterMotion } from '../motion/use-enter-motion';
import { InicialesBadge, MText } from '../Mostrador/mtext';
import { Eyebrow } from '../Panel/panel';
import { PathIcon } from '../PathIcon/path-icon';

export interface BloqueoOperador {
  readonly nombre: string;
  readonly iniciales: string;
  /** «Turno abierto desde las 08:15». */
  readonly detalle?: string;
}

export interface BloqueoShellProps {
  /** «Caja 1 · Taquería Don Pedro», from the session. */
  readonly contexto: string;
  readonly operador?: BloqueoOperador;
  /** The unlock: the NIP pad and its note. */
  readonly children: ReactNode;
  readonly testID?: string;
}

const CANDADO = {
  width: 56,
  height: 56,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: shapeRadii.pill,
  borderWidth: borderWidths.thick,
  borderColor: colors.black,
  backgroundColor: colors.white,
  boxShadow: shadows.small,
} as const;

function Candado(): ReactElement {
  const motion = useEnterMotion('pop');
  return (
    <Animated.View style={[CANDADO, motion]}>
      <PathIcon d={ICONS.lock} size={26} strokeWidth={2.4} />
    </Animated.View>
  );
}

function OperadorCard({ o }: { o: BloqueoOperador }): ReactElement {
  return (
    <View
      flexDirection="row"
      alignItems="center"
      gap={10}
      minHeight={52}
      paddingLeft={8}
      paddingRight={14}
      borderRadius={radii[3]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <InicialesBadge iniciales={o.iniciales} size={36} />
      <View flex={1} minWidth={0}>
        <MText size="body" weight="extraBold">
          {o.nombre}
        </MText>
        {o.detalle ? (
          <MText size="xs" weight="semibold" color={colors.gray600}>
            {o.detalle}
          </MText>
        ) : null}
      </View>
    </View>
  );
}

function Head(props: BloqueoShellProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="center" gap={14}>
      <Candado />
      <View flex={1} minWidth={0} gap={2}>
        <Eyebrow color={colors.ink}>{props.contexto}</Eyebrow>
        <MText role="heading" aria-level={1} size="xl4" weight="extraBold" letterSpacing={-0.9}>
          {t('shell.bloqueo.title')}
        </MText>
      </View>
    </View>
  );
}

export function BloqueoShell(props: BloqueoShellProps): ReactElement {
  return (
    <View testID={props.testID ?? 'bloqueo'} flex={1} backgroundColor={colors.gray200}>
      <View
        gap={14}
        paddingHorizontal={16}
        paddingTop={20}
        paddingBottom={16}
        backgroundColor={colors.yellow}
        borderBottomWidth={borderWidths.thick}
        borderBottomColor={colors.black}
      >
        <Head {...props} />
        {props.operador ? <OperadorCard o={props.operador} /> : null}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>{props.children}</ScrollView>
    </View>
  );
}
