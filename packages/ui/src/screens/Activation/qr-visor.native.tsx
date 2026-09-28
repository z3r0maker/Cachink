/**
 * QrVisor on the phone: `expo-camera`'s `CameraView` reading QR codes only,
 * inside MvVincular's frame. The first code that is a pairing link goes up
 * once (`onToken`); anything else says «Ese código no es de Xangarro» in the
 * pill and keeps reading. Without the camera permission the frame asks for
 * it; if the OS will not ask again, «Escribe el código» below is the way.
 */
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { View } from '@tamagui/core';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Btn, MText } from '../../components/index';
import { notificationSuccess } from '../../haptics/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { tokenDeQr } from './activation-form';
import type { QrVisorProps } from './qr-visor';
import { VisorMarco } from './qr-visor-marco';

type Permiso = ReturnType<typeof useCameraPermissions>[0];

function PedirCamara(props: { permiso: Permiso; pedir: () => void }): ReactElement {
  const { t } = useTranslation();
  const puede = props.permiso !== null && props.permiso.canAskAgain;
  return (
    <View flex={1} alignItems="center" justifyContent="center" gap={14} padding={24}>
      <MText size="body" weight="bold" color={colors.white} textAlign="center">
        {t('entrar.vincular.visorPermiso')}
      </MText>
      {puede ? (
        <Btn variant="primary" size="lg" onPress={props.pedir} testID="vincular-permitir">
          {t('entrar.vincular.visorPermitir')}
        </Btn>
      ) : null}
    </View>
  );
}

function useLectura(props: QrVisorProps) {
  const leido = useRef(false);
  const [ajeno, setAjeno] = useState(false);
  useEffect(() => {
    if (props.activo) leido.current = false;
  }, [props.activo]);
  const onScan = ({ data }: { data: string }): void => {
    if (leido.current || !props.activo) return;
    const token = tokenDeQr(data);
    if (token === null) {
      setAjeno(true);
      return;
    }
    leido.current = true;
    setAjeno(false);
    notificationSuccess();
    props.onToken(token);
  };
  return { ajeno, onScan };
}

export function QrVisor(props: QrVisorProps): ReactElement {
  const { t } = useTranslation();
  const [permiso, pedir] = useCameraPermissions();
  const { ajeno, onScan } = useLectura(props);
  const ok = permiso?.granted === true;
  const pista = t(ajeno ? 'entrar.vincular.visorNoEs' : 'entrar.vincular.visorHint');
  return (
    <VisorMarco etiqueta={t('entrar.vincular.visorCamara')} pista={pista} mira={ok}>
      {ok ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          accessibilityLabel={t('entrar.vincular.visorAria')}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={props.activo ? onScan : undefined}
        />
      ) : (
        <PedirCamara permiso={permiso} pedir={() => void pedir()} />
      )}
    </VisorMarco>
  );
}
