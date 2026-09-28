/**
 * «Escribe el código» (MvVincular, the typed path; the web's OpVincular):
 * three numbered steps, the owner's correo, the eight letters, and the aviso
 * de privacidad; «Conectar esta caja» waits in the foot and says what is
 * still missing. A rejected code turns the boxes red with the server's reason.
 */
import type { ReactElement } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { View } from '@tamagui/core';
import { Eyebrow, MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, radii } from '../../theme';
import { faltaParaConectar, correoValido, ACTIVATION_CODE_LENGTH } from './activation-form';
import type { DescargaInicial } from '../../activation/use-descarga';
import { CampoCorreo, CodigoCajas } from './vincular-campos';
import { BotonConectar, VincularDescarga } from './vincular-descarga';
import { AvisoVinculacion, CabezaVolver, Paso, Pie } from './vincular-partes';

export interface VincularCodigoProps {
  readonly email: string;
  readonly onEmail: (v: string) => void;
  readonly codigo: string;
  readonly onCodigo: (v: string) => void;
  readonly onVolver: () => void;
  readonly onConectar: () => void;
  readonly submitting: boolean;
  /** i18n key of the server's refusal, if any. */
  readonly errorKey: string | null;
  /** DS-10: a big business's pages after the first, once the code was accepted. */
  readonly descarga?: DescargaInicial | null;
  readonly onReintentar?: () => void;
}

const ALERTA = 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 8v4M12 16h.01';

function ErrorCodigo({ texto }: { texto: string }): ReactElement {
  return (
    <View
      testID="activation-error"
      role="alert"
      flexDirection="row"
      gap={8}
      paddingHorizontal={12}
      paddingVertical={10}
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.redText}
      backgroundColor={colors.redSoft}
    >
      <PathIcon d={ALERTA} size={18} strokeWidth={2.2} color={colors.redText} />
      <MText flex={1} size="sm" weight="bold" color={colors.redText}>
        {texto}
      </MText>
    </View>
  );
}

function PasoCodigo(p: VincularCodigoProps): ReactElement {
  const { t } = useTranslation();
  return (
    <Paso n={2} hecho={p.codigo.length === ACTIVATION_CODE_LENGTH && p.errorKey === null}>
      <View flexDirection="row" alignItems="center" justifyContent="space-between" height={28}>
        <MText size="body" weight="extraBold">
          {t('entrar.vincular.codigo')}
        </MText>
        <MText size="sm" weight="bold" color={colors.gray600} fontVariant={['tabular-nums']}>
          {t('entrar.vincular.cuenta', { n: p.codigo.length })}
        </MText>
      </View>
      <CodigoCajas
        codigo={p.codigo}
        onCodigo={p.onCodigo}
        error={p.errorKey !== null}
        label={t('entrar.vincular.codigo')}
      />
      {p.errorKey ? <ErrorCodigo texto={t(p.errorKey as never)} /> : null}
      <MText size="sm" weight="semibold" color={colors.gray600}>
        {t('entrar.vincular.codigoAyuda')}
      </MText>
    </Paso>
  );
}

function PieConectar(p: VincularCodigoProps): ReactElement {
  const { t } = useTranslation();
  const falta = faltaParaConectar(p.email, p.codigo);
  const texto =
    falta === null
      ? null
      : falta.que === 'correo'
        ? t('entrar.vincular.faltaCorreo')
        : t('entrar.vincular.faltanLetras', { n: falta.n });
  return (
    <Pie>
      <BotonConectar
        label={t('entrar.vincular.conectar')}
        disabled={falta !== null}
        submitting={p.submitting}
        descarga={p.descarga ?? null}
        onConectar={p.onConectar}
        onReintentar={() => p.onReintentar?.()}
        testID="activation-submit"
      />
      {p.descarga ? <VincularDescarga d={p.descarga} /> : null}
      {texto && !p.descarga ? (
        <MText size="sm" weight="bold" color={colors.gray600} textAlign="center">
          {texto}
        </MText>
      ) : null}
    </Pie>
  );
}

export function VincularCodigo(p: VincularCodigoProps): ReactElement {
  const { t } = useTranslation();
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <CabezaVolver etiqueta={t('entrar.vincular.escanear')} onPress={p.onVolver} />
      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 18 }}
        keyboardShouldPersistTaps="handled"
      >
        <View gap={6}>
          <Eyebrow color={colors.gray600}>{t('entrar.vincular.eyebrow')}</Eyebrow>
          <MText role="heading" aria-level={1} size="xl4" weight="extraBold" letterSpacing={-0.9}>
            {t('entrar.vincular.codigoTitulo')}
          </MText>
          <MText size="md" weight="semibold" color={colors.gray600}>
            {t('entrar.vincular.codigoCuerpo')}
          </MText>
        </View>
        <Paso n={1} hecho={correoValido(p.email)}>
          <MText size="body" weight="extraBold" lineHeight={28}>
            {t('entrar.vincular.correo')}
          </MText>
          <CampoCorreo value={p.email} onChange={p.onEmail} label={t('entrar.vincular.correo')} />
        </Paso>
        <PasoCodigo {...p} />
        <Paso n={3} hecho={faltaParaConectar(p.email, p.codigo) === null}>
          <AvisoVinculacion />
        </Paso>
      </ScrollView>
      <PieConectar {...p} />
    </KeyboardAvoidingView>
  );
}
