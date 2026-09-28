/**
 * «Código leído» (MvVincular's sheet). The board asks «¿Es tu negocio?» with
 * the business's name, but the activation API can only name the business by
 * redeeming the token (there is no preview call), so the sheet confirms the
 * linking itself: the aviso de privacidad and «Conectar esta caja», or back
 * to the camera. Nothing links on the scan alone.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { BottomSheet, Btn, MText } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import type { DescargaInicial } from '../../activation/use-descarga';
import { BotonConectar, VincularDescarga } from './vincular-descarga';
import { AvisoVinculacion } from './vincular-partes';

export interface VincularLeidoProps {
  readonly open: boolean;
  readonly onConectar: () => void;
  readonly onVolver: () => void;
  readonly submitting: boolean;
  readonly errorKey: string | null;
  /** DS-10: a big business's pages after the first, once the code was accepted. */
  readonly descarga?: DescargaInicial | null;
  readonly onReintentar?: () => void;
}

function Acciones(p: VincularLeidoProps): ReactElement {
  const { t } = useTranslation();
  return (
    <View gap={8}>
      <BotonConectar
        label={t('entrar.vincular.conectar')}
        submitting={p.submitting}
        descarga={p.descarga ?? null}
        onConectar={p.onConectar}
        onReintentar={() => p.onReintentar?.()}
        testID="vincular-leido-conectar"
      />
      {p.descarga ? <VincularDescarga d={p.descarga} /> : null}
      <Btn variant="quiet" size="lg" fullWidth onPress={p.onVolver} testID="vincular-leido-volver">
        {t('entrar.vincular.volverCamara')}
      </Btn>
    </View>
  );
}

export function VincularLeido(p: VincularLeidoProps): ReactElement {
  const { t } = useTranslation();
  return (
    <BottomSheet
      open={p.open}
      onClose={p.onVolver}
      eyebrow={t('entrar.vincular.leidoEyebrow')}
      title={t('entrar.vincular.leidoTitulo')}
      closeLabel={t('entrar.vincular.volverCamara')}
      footer={<Acciones {...p} />}
      testID="vincular-leido"
    >
      <View gap={12}>
        <MText size="md" weight="semibold" color={colors.gray600}>
          {t('entrar.vincular.leidoCuerpo')}
        </MText>
        {p.errorKey ? (
          <MText
            testID="activation-error"
            role="alert"
            size="sm"
            weight="bold"
            color={colors.redText}
          >
            {t(p.errorKey as never)}
          </MText>
        ) : null}
        <AvisoVinculacion />
      </View>
    </BottomSheet>
  );
}
