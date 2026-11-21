/**
 * The business a scanned code names (MvVincular «Código leído», N-25): the
 * yellow shop tile, the business's name, «Dueño: Pedro · correo» and, under a
 * rule, «Revisa que diga el nombre de tu negocio.». The names come from
 * `/activate/preview`, which consumed nothing.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { ActivatePreviewResponse } from '@xangarro/contracts';
import { Card, GLYPHS, MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderColors, borderWidths, colors, radii } from '../../theme';
import { duenoLeido } from './activation-form';

function Tienda(): ReactElement {
  return (
    <View
      width={52}
      height={52}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[4]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.yellow}
    >
      <PathIcon d={GLYPHS.tienda} size={24} strokeWidth={2.2} color={colors.black} />
    </View>
  );
}

function LineaDueno({ negocio }: { negocio: ActivatePreviewResponse }): ReactElement | null {
  const { t } = useTranslation();
  const dueno = duenoLeido(negocio.ownerFirstName, negocio.ownerEmail);
  if (dueno === null) return null;
  const texto =
    dueno.que === 'ambos'
      ? t('entrar.vincular.leidoDueno', { nombre: dueno.nombre, correo: dueno.correo })
      : t('entrar.vincular.leidoDuenoUno', { dueno: dueno.dueno });
  return (
    <MText
      testID="vincular-leido-dueno"
      size="sm"
      weight="semibold"
      color={colors.gray600}
      numberOfLines={1}
    >
      {texto}
    </MText>
  );
}

export function NegocioLeido({ negocio }: { negocio: ActivatePreviewResponse }): ReactElement {
  const { t } = useTranslation();
  return (
    <Card variant="white" elevation="raised" padding="md" testID="vincular-leido-negocio">
      <View gap={12}>
        <View flexDirection="row" alignItems="center" gap={12}>
          <Tienda />
          <View flex={1} gap={2}>
            <MText testID="vincular-leido-nombre" size="xl" weight="extraBold" letterSpacing={-0.4}>
              {negocio.businessName}
            </MText>
            <LineaDueno negocio={negocio} />
          </View>
        </View>
        <View
          paddingTop={12}
          borderTopWidth={borderWidths.quiet}
          borderTopColor={borderColors.quiet}
        >
          <MText size="body" weight="bold">
            {t('entrar.vincular.leidoRevisa')}
          </MText>
        </View>
      </View>
    </Card>
  );
}
