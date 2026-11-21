/**
 * «Código leído» (MvVincular's sheet; N-25, SEC-MOB-04): «¿Es tu negocio?».
 * The scan asked `/activate/preview` which business the token names, without
 * consuming it, so the sheet shows that business and its owner, the same
 * aviso de privacidad as the typed path, «Conectar esta caja» (which redeems)
 * and «No es mi negocio» (back to the camera, nothing redeemed).
 *
 * While the preview is on its way the card waits; if the server refuses the
 * token (expired, used, unknown) or there is no network, the sheet says so
 * in the activation error copy and offers only the way back to the camera.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { ActivatePreviewResponse } from '@xangarro/contracts';
import { BottomSheet, Btn, MText, Spinner } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { colors } from '../../theme';
import { AvisoVinculacion } from './aviso-vinculacion';
import { NegocioLeido } from './vincular-negocio';

/** What the preview has answered for the token on screen. */
export type VistaPrevia =
  | { readonly estado: 'cargando' }
  | { readonly estado: 'listo'; readonly negocio: ActivatePreviewResponse }
  | { readonly estado: 'error'; readonly errorKey: string };

export interface VincularLeidoProps {
  readonly open: boolean;
  readonly vista: VistaPrevia;
  readonly onConectar: () => void;
  readonly onVolver: () => void;
  readonly submitting: boolean;
  /** i18n key of the redeem's refusal, if any. */
  readonly errorKey: string | null;
}

function Acciones(p: VincularLeidoProps): ReactElement {
  const { t } = useTranslation();
  if (p.vista.estado === 'error') {
    return (
      <Btn
        variant="secondary"
        size="xl"
        fullWidth
        onPress={p.onVolver}
        testID="vincular-leido-volver"
      >
        {t('entrar.vincular.volverCamara')}
      </Btn>
    );
  }
  return (
    <View gap={8}>
      <Btn
        variant="primary"
        size="xl"
        fullWidth
        disabled={p.vista.estado !== 'listo'}
        loading={p.submitting}
        onPress={p.onConectar}
        testID="vincular-leido-conectar"
      >
        {t('entrar.vincular.conectar')}
      </Btn>
      <Btn variant="quiet" size="lg" fullWidth onPress={p.onVolver} testID="vincular-leido-no-es">
        {t('entrar.vincular.noEsMiNegocio')}
      </Btn>
    </View>
  );
}

function ErrorLeido({ errorKey }: { errorKey: string }): ReactElement {
  const { t } = useTranslation();
  return (
    <MText testID="activation-error" role="alert" size="sm" weight="bold" color={colors.redText}>
      {t(errorKey as never)}
    </MText>
  );
}

function Cargando(): ReactElement {
  const { t } = useTranslation();
  return (
    <View testID="vincular-leido-cargando" alignItems="center" gap={8} paddingVertical={24}>
      <Spinner size="sm" />
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {t('common.loading')}
      </MText>
    </View>
  );
}

function Cuerpo(p: VincularLeidoProps): ReactElement {
  if (p.vista.estado === 'error') return <ErrorLeido errorKey={p.vista.errorKey} />;
  return (
    <View gap={12}>
      {p.vista.estado === 'listo' ? <NegocioLeido negocio={p.vista.negocio} /> : <Cargando />}
      {p.errorKey ? <ErrorLeido errorKey={p.errorKey} /> : null}
      <AvisoVinculacion />
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
      <Cuerpo {...p} />
    </BottomSheet>
  );
}
