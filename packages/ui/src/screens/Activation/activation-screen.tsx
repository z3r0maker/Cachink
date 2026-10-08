/**
 * ActivationScreen — Vincular (MvVincular; A-04, C-14, ADR-053 §2): the
 * first screen of a fresh install. The camera reads the portal's pairing QR
 * and a sheet confirms the linking; «Escribe el código» is the typed path
 * (the owner's correo and the 8 letters). No purchase UI, no checkout link.
 *
 * Presentational: the gate hands it the two submit paths, whether a request
 * is in flight and the i18n key of the last refusal.
 */

import { useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { DescargaInicial } from '../../activation/use-descarga';
import { colors } from '../../theme';
import { VincularCodigo } from './vincular-codigo';
import { VincularEscanear } from './vincular-escanear';
import { VincularLeido } from './vincular-leido';

export interface ActivationScreenProps {
  readonly onSubmit: (input: { email: string; code: string }) => void;
  /** The scan path: the pairing token alone (C-14). */
  readonly onScan: (qrToken: string) => void;
  readonly submitting: boolean;
  /** i18n key of the current error, if any. */
  readonly errorKey?: string | null;
  /** DS-10: the snapshot's remaining pages after the code was accepted; null otherwise. */
  readonly descarga?: DescargaInicial | null;
  readonly onReintentar?: () => void;
  /** The view to open on (the stories show both). */
  readonly vistaInicial?: 'escanear' | 'codigo';
  readonly testID?: string;
}

function useVincular(props: ActivationScreenProps) {
  const [vista, setVista] = useState<'escanear' | 'codigo'>(props.vistaInicial ?? 'escanear');
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  // The refusal belongs to what was sent: editing either field clears it.
  const [enviado, setEnviado] = useState('');
  const actual = `${email.trim()}|${codigo}`;
  return {
    errorKey: enviado === actual ? (props.errorKey ?? null) : null,
    enviar: () => {
      setEnviado(actual);
      props.onSubmit({ email: email.trim(), code: codigo });
    },
    vista,
    token,
    email,
    codigo,
    setEmail,
    setCodigo,
    irCodigo: () => setVista('codigo'),
    irEscanear: () => {
      setVista('escanear');
      setToken(null);
    },
    leer: setToken,
  };
}

export function ActivationScreen(props: ActivationScreenProps): ReactElement {
  const v = useVincular(props);
  return (
    <View testID={props.testID ?? 'activation-screen'} flex={1} backgroundColor={colors.gray200}>
      {v.vista === 'codigo' ? (
        <VincularCodigo
          email={v.email}
          onEmail={v.setEmail}
          codigo={v.codigo}
          onCodigo={v.setCodigo}
          onVolver={v.irEscanear}
          onConectar={v.enviar}
          submitting={props.submitting}
          errorKey={v.errorKey}
          descarga={props.descarga ?? null}
          onReintentar={props.onReintentar}
        />
      ) : (
        <VincularEscanear onToken={v.leer} leyendo={v.token === null} onEscribir={v.irCodigo} />
      )}
      <VincularLeido
        open={v.vista === 'escanear' && v.token !== null}
        onConectar={() => (v.token === null ? undefined : props.onScan(v.token))}
        onVolver={v.irEscanear}
        submitting={props.submitting}
        errorKey={props.errorKey ?? null}
        descarga={props.descarga ?? null}
        onReintentar={props.onReintentar}
      />
    </View>
  );
}
