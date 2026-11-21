/**
 * ActivationScreen — Vincular (MvVincular; A-04, C-14, ADR-053 §2): the
 * first screen of a fresh install. The camera reads the portal's pairing QR
 * (or a link opens the app with one) and a sheet asks «¿Es tu negocio?»
 * before anything links (N-25); «Escribe el código» is the typed path (the
 * owner's correo and the 8 letters). No purchase UI, no checkout link.
 *
 * Presentational: the gate hands it the two submit paths, the preview of the
 * token on screen, whether a request is in flight and the i18n key of the
 * last refusal.
 */

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { colors } from '../../theme';
import { errorDeLoEnviado } from './activation-form';
import { VincularCodigo } from './vincular-codigo';
import { VincularEscanear } from './vincular-escanear';
import { VincularLeido, type VistaPrevia } from './vincular-leido';

export interface ActivationScreenProps {
  readonly onSubmit: (input: { email: string; code: string }) => void;
  /** The scan path: the pairing token alone (C-14), once the person said it is their business. */
  readonly onScan: (qrToken: string) => void;
  /** A token was read: ask which business it names (N-25). */
  readonly onLeer?: (qrToken: string) => void;
  /** Back to the camera: the preview of the last token no longer applies. */
  readonly onSoltar?: () => void;
  /** What the preview answered for the token on screen; waiting until it does. */
  readonly vistaPrevia?: VistaPrevia;
  /** A token a link opened the app with (`xangarro://activar#c=…`); each read its own object. */
  readonly enlace?: { readonly token: string } | null;
  readonly submitting: boolean;
  /** i18n key of the current error, if any. */
  readonly errorKey?: string | null;
  /** Right after «Desvincular y borrar»: the scan view says «Listo». */
  readonly borrado?: boolean;
  /** The view to open on (the stories show both). */
  readonly vistaInicial?: 'escanear' | 'codigo';
  readonly testID?: string;
}

function useVincular(props: ActivationScreenProps) {
  const [vista, setVista] = useState<'escanear' | 'codigo'>(props.vistaInicial ?? 'escanear');
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  // The refusal belongs to what was sent: editing either field, or reading
  // another QR, clears it (R7).
  const [enviado, setEnviado] = useState<string | null>(null);
  const actual = `${email.trim()}|${codigo}`;
  const qr = token === null ? null : `qr|${token}`;
  const error = props.errorKey ?? null;
  return {
    errorKey: errorDeLoEnviado(enviado, actual, error),
    errorQr: errorDeLoEnviado(enviado, qr, error),
    enviar: () => {
      setEnviado(actual);
      props.onSubmit({ email: email.trim(), code: codigo });
    },
    conectarQr: () => {
      if (token === null || qr === null) return;
      setEnviado(qr);
      props.onScan(token);
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
      props.onSoltar?.();
    },
    leer: (leido: string) => {
      setVista('escanear');
      setToken(leido);
      props.onLeer?.(leido);
    },
  };
}

const CARGANDO: VistaPrevia = { estado: 'cargando' };

/** A link is read like a scan, once per time it is opened. */
function useEnlace(
  enlace: { readonly token: string } | null | undefined,
  leer: (token: string) => void,
): void {
  const ultimo = useRef(leer);
  ultimo.current = leer;
  useEffect(() => {
    if (enlace) ultimo.current(enlace.token);
  }, [enlace]);
}

export function ActivationScreen(props: ActivationScreenProps): ReactElement {
  const v = useVincular(props);
  useEnlace(props.enlace, v.leer);
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
        />
      ) : (
        <VincularEscanear
          onToken={v.leer}
          leyendo={v.token === null}
          onEscribir={v.irCodigo}
          borrado={props.borrado}
        />
      )}
      <VincularLeido
        open={v.vista === 'escanear' && v.token !== null}
        vista={props.vistaPrevia ?? CARGANDO}
        onConectar={v.conectarQr}
        onVolver={v.irEscanear}
        submitting={props.submitting}
        errorKey={v.errorQr}
      />
    </View>
  );
}
