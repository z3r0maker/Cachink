/**
 * BloqueoScreen — the locked caja (MvBloqueo; the web caja's `BloqueoCaja`):
 * M-05's `BloqueoShell` with who holds the turno, and below it the NIP pad
 * with the bigger keys and «Desbloquear». «No soy Ana, cambiar de persona»
 * drops the lock and goes to Acceso.
 *
 * Locking never closes the turno (use-auto-lock); the pad checks the same NIP
 * and the same cooldown as Acceso.
 */
import { useEffect, useState, type ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import type { UserId } from '@xangarro/domain';
import { BloqueoShell, MText, SafeAreaSpacer, type BloqueoOperador } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { NipPad } from '../Login/nip-pad';
import { primerNombreDe, teclearNip } from '../Login/nip';

export interface BloqueoScreenProps {
  /** «Caja 1 · Taquería Don Pedro». */
  readonly contexto: string;
  readonly userId: UserId;
  readonly operador: BloqueoOperador;
  readonly onUnlock: (userId: UserId, pin: string) => void;
  /** «No soy …»: back to Acceso. */
  readonly onCambiar: () => void;
  readonly error: string | null;
  readonly submitting: boolean;
}

function Titulo(): ReactElement {
  const { t } = useTranslation();
  return (
    <View flexDirection="row" alignItems="center" justifyContent="space-between">
      <MText size="lg" weight="extraBold">
        {t('entrar.bloqueo.seguir')}
      </MText>
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {t('entrar.nip.cuatro')}
      </MText>
    </View>
  );
}

function NoSoy(props: { nombre: string; onPress: () => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <Pressable
      testID="bloqueo-cambiar"
      role="button"
      onPress={props.onPress}
      style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 }}
    >
      <MText size="md" weight="bold" textDecorationLine="underline">
        {t('entrar.bloqueo.noSoy', { nombre: props.nombre })}
      </MText>
    </Pressable>
  );
}

export function BloqueoScreen(props: BloqueoScreenProps): ReactElement {
  const [nip, setNip] = useState('');
  useEffect(() => {
    if (props.error !== null) setNip('');
  }, [props.error]);
  return (
    <View flex={1} backgroundColor={colors.yellow}>
      <SafeAreaSpacer />
      <BloqueoShell contexto={props.contexto} operador={props.operador}>
        <View gap={12}>
          <Titulo />
          <NipPad
            nip={nip}
            onTecla={(t) => setNip((n) => teclearNip(n, t))}
            onEnviar={() => props.onUnlock(props.userId, nip)}
            accion="desbloquear"
            grande
            bloqueado={props.submitting}
            error={props.error}
          />
        </View>
        <NoSoy nombre={primerNombreDe(props.operador.nombre)} onPress={props.onCambiar} />
      </BloqueoShell>
    </View>
  );
}
