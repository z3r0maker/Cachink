/**
 * SyncBanner: the strip under the caja's header (N-22, board AtBanners;
 * the amber one was MvEstados «Sin internet»). A tone's ground, a black rule
 * under it, the Lucide icon in a white circle, what happened and what to do,
 * and a chevron: the whole strip is one tap. Never blocks capture (CLAUDE.md
 * §2.2); the icon and the words carry the severity, not the colour alone.
 * Which banner, and its words, is `bannerSync` (`sync/sync-banner.ts`).
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import type { BannerSync, TonoBanner } from '../../sync/sync-banner';
import { borderWidths, colors, shapeRadii } from '../../theme';
import { MText } from '../Mostrador/mtext';
import { GLYPHS } from '../PathIcon/glyphs';
import { PathIcon } from '../PathIcon/path-icon';

const TONOS: Record<
  TonoBanner,
  { readonly fondo: string; readonly tinta: string; readonly icono: string }
> = {
  rojo: { fondo: colors.redSoft, tinta: colors.redText, icono: GLYPHS.alerta },
  ambar: { fondo: colors.warningSoft, tinta: colors.warningText, icono: GLYPHS.sinRed },
  gris: { fondo: colors.gray100, tinta: colors.gray600, icono: GLYPHS.historial },
};

function Icono(p: { readonly d: string; readonly tinta: string }): ReactElement {
  return (
    <View
      width={32}
      height={32}
      alignItems="center"
      justifyContent="center"
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={colors.white}
    >
      <PathIcon d={p.d} size={16} strokeWidth={2.4} color={p.tinta} />
    </View>
  );
}

export interface SyncBannerProps {
  readonly banner: BannerSync;
  readonly onPress: () => void;
}

export function SyncBanner({ banner, onPress }: SyncBannerProps): ReactElement {
  const t = TONOS[banner.tono];
  return (
    <Pressable
      testID={banner.testID}
      role="button"
      aria-live="polite"
      accessibilityLabel={`${banner.titulo}. ${banner.cuerpo}`}
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: t.fondo,
        borderBottomWidth: borderWidths.thin,
        borderBottomColor: colors.black,
      }}
    >
      <Icono d={t.icono} tinta={t.tinta} />
      <View flex={1} minWidth={0}>
        <MText weight="extraBold">{banner.titulo}</MText>
        <MText size="sm" weight="semibold" color={colors.ink}>
          {banner.cuerpo}
        </MText>
      </View>
      <PathIcon d={GLYPHS.chevronRight} size={18} strokeWidth={2.4} color={t.tinta} />
    </Pressable>
  );
}
