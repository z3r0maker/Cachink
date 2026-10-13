/**
 * AvisoCajaTarjeta — a notice the caja raised (M-09; the web's
 * `AvisoSistema`): the tinted tile with its glyph, the kind · time · unread
 * meta, what happened and what to do. Its cta opens the screen that solves
 * it; its tint follows the notice's tone, never the severity alone.
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import type { Aviso, AvisoTono } from '@xangarro/caja/avisos';
import { MText } from '../../components/Mostrador/index';
import { PathIcon } from '../../components/PathIcon/index';
import { borderWidths, colors, radii, shapeRadii } from '../../theme';

const TINTE: Record<AvisoTono, string> = {
  alerta: colors.redSoft,
  dueno: colors.yellowSoft,
  atencion: colors.warningSoft,
  info: colors.blueSoft,
  hecho: colors.greenSoft,
};

export interface AvisoCajaProps {
  readonly aviso: Aviso;
  readonly onAbrir: (href: string) => void;
}

function Tile({ icono, tono }: { readonly icono: string; readonly tono: AvisoTono }): ReactElement {
  return (
    <View
      width={40}
      height={40}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.quiet}
      backgroundColor={TINTE[tono]}
    >
      <PathIcon d={icono} size={18} strokeWidth={2.3} />
    </View>
  );
}

function Cta(
  p: { readonly label: string; readonly href: string } & Pick<AvisoCajaProps, 'onAbrir'>,
): ReactElement {
  return (
    <Pressable
      testID={`aviso-caja-cta-${p.href}`}
      role="link"
      accessibilityLabel={p.label}
      onPress={() => p.onAbrir(p.href)}
      style={{
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: radii[2],
        borderWidth: borderWidths.thin,
        borderColor: colors.black,
        backgroundColor: colors.white,
      }}
    >
      <MText size="sm" weight="extraBold">
        {p.label}
      </MText>
    </Pressable>
  );
}

export function AvisoCajaTarjeta({ aviso: a, onAbrir }: AvisoCajaProps): ReactElement {
  return (
    <View
      testID={`aviso-caja-${a.id}`}
      flexDirection="row"
      alignItems="center"
      gap={12}
      padding={14}
      borderRadius={radii[4]}
      borderWidth={borderWidths.quiet}
      backgroundColor={colors.white}
    >
      <Tile icono={a.icono} tono={a.tono} />
      <View flex={1} minWidth={0} gap={3}>
        <View flexDirection="row" alignItems="center" gap={6}>
          <MText size="xs" weight="extraBold" color={colors.gray600} numberOfLines={1}>
            {a.tipo}
          </MText>
          <MText size="xs" weight="semibold" color={colors.gray600} numberOfLines={1}>
            · {a.hora}
          </MText>
          {a.leido ? null : (
            <MText size="xs" weight="extraBold" color={colors.warningText} numberOfLines={1}>
              · Sin leer
            </MText>
          )}
        </View>
        <MText size="md" weight="extraBold">
          {a.titulo}
        </MText>
        <MText size="sm" weight="semibold" color={colors.gray600} lineHeight={19}>
          {a.cuerpo}
        </MText>
      </View>
      {a.cta ? <Cta {...a.cta} onAbrir={onAbrir} /> : null}
    </View>
  );
}
