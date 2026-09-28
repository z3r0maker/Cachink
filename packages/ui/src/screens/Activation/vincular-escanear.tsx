/**
 * «Escanea el código del dueño» (MvVincular, the scan path, C-14): Don says
 * the caja is not linked yet, the camera reads the portal's QR inline, the
 * amber note says the QR lasts 15 minutes, and «Escribe el código» waits in
 * the foot for when the camera can't.
 */
import type { ReactElement } from 'react';
import { ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { Btn, Eyebrow, MText, PathIcon } from '../../components/index';
import { DonBurbuja } from '../../components/Don/don-burbuja';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { QrVisor } from './qr-visor';
import { CabezaMarca, NotaAmbar, Pie } from './vincular-partes';

const TECLADO =
  'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8';

export interface VincularEscanearProps {
  readonly onToken: (token: string) => void;
  /** False while the confirm sheet is open. */
  readonly leyendo: boolean;
  readonly onEscribir: () => void;
}

function Encabezado(): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={6}>
      <Eyebrow color={colors.gray600}>{t('entrar.vincular.eyebrow')}</Eyebrow>
      <MText role="heading" aria-level={1} size="xl4" weight="extraBold" letterSpacing={-0.9}>
        {t('entrar.vincular.escanearTitulo')}
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600}>
        {t('entrar.vincular.escanearCuerpo')}
      </MText>
    </View>
  );
}

export function VincularEscanear(props: VincularEscanearProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View flex={1}>
      <CabezaMarca />
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 14, gap: 14 }}>
        <DonBurbuja pose="senalando" size={80}>
          <MText size="body" weight="extraBold">
            {t('entrar.vincular.don')}
          </MText>
        </DonBurbuja>
        <Encabezado />
        <QrVisor onToken={props.onToken} activo={props.leyendo} />
        <NotaAmbar texto={t('entrar.vincular.vence')} />
      </ScrollView>
      <Pie>
        <Btn
          variant="secondary"
          size="xl"
          fullWidth
          onPress={props.onEscribir}
          icon={<PathIcon d={TECLADO} size={20} />}
          testID="vincular-escribir"
        >
          {t('entrar.vincular.escribir')}
        </Btn>
        <MText size="sm" weight="semibold" color={colors.gray600} textAlign="center">
          {t('entrar.vincular.escribirNota')}
        </MText>
      </Pie>
    </View>
  );
}
