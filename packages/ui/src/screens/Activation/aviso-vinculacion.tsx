/**
 * The aviso de privacidad at linking (N-34, variante B: shown, never a
 * checkbox). Its version travels with the request (`use-activate.ts`). The
 * full aviso opens from a button, never a bare address (MvVincular «aviso con
 * botón»; App Review 5.1.1(i)).
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import { AVISO_PUBLICO_URL, AVISO_VINCULACION, AVISO_VINCULACION_ENLACE } from '@xangarro/domain';
import { abrirEnNavegador } from '../../app/abrir-en-navegador';
import { Btn, GLYPHS, MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';

export function AvisoVinculacion(): ReactElement {
  const { t } = useTranslation();
  return (
    <View
      gap={4}
      padding={12}
      borderRadius={radii[3]}
      borderWidth={borderWidths.quiet}
      borderColor={borderColors.quiet}
      backgroundColor={colors.white}
    >
      <MText size="body" weight="extraBold">
        {t('entrar.vincular.aviso')}
      </MText>
      <MText testID="activation-aviso" size="sm" weight="semibold" color={colors.gray600}>
        {AVISO_VINCULACION.join(' ')}
      </MText>
      <View alignSelf="flex-start" marginTop={6}>
        <Btn
          variant="secondary"
          size="md"
          onPress={() => abrirEnNavegador(AVISO_PUBLICO_URL)}
          icon={<PathIcon d={GLYPHS.externo} size={16} strokeWidth={2.4} />}
          testID="activation-aviso-enlace"
        >
          {AVISO_VINCULACION_ENLACE}
        </Btn>
      </View>
    </View>
  );
}
