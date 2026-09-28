/**
 * Inicio's shortcut tiles (MvInicio «Atajos»): Gastos and Inventario, the
 * money and the stock of the turno a tap away. Fiado y abonos joins them
 * when the phone has it (M-08).
 */
import type { ReactElement } from 'react';
import { Pressable, type ViewStyle } from 'react-native';
import { View } from '@tamagui/core';
import { ICONS } from '@xangarro/caja';
import { MText, PathIcon } from '../../components/index';
import { useTranslation } from '../../i18n/index';
import { borderWidths, colors, radii, shadows } from '../../theme';
import { ATAJOS } from './inicio-rutas';

const LOOK = {
  gastos: { icon: ICONS.gastos, tint: colors.redSoft },
  inventario: { icon: ICONS.inventario, tint: colors.greenSoft },
} as const;

const estilo = ({ pressed }: { pressed: boolean }): ViewStyle => ({
  flex: 1,
  minHeight: 92,
  justifyContent: 'space-between',
  gap: 8,
  padding: 12,
  borderRadius: radii[4],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
  backgroundColor: colors.white,
  boxShadow: pressed ? shadows.pressed : shadows.small,
  transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
});

function Glifo({ k }: { k: keyof typeof LOOK }): ReactElement {
  return (
    <View
      width={40}
      height={40}
      alignItems="center"
      justifyContent="center"
      borderRadius={radii[2]}
      borderWidth={borderWidths.thin}
      borderColor={colors.black}
      backgroundColor={LOOK[k].tint}
    >
      <PathIcon d={LOOK[k].icon} size={20} />
    </View>
  );
}

function Atajo(p: {
  k: keyof typeof LOOK;
  path: string;
  onNavigate: (path: string) => void;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <Pressable
      testID={`inicio-atajo-${p.k}`}
      role="link"
      onPress={() => p.onNavigate(p.path)}
      style={estilo}
    >
      <Glifo k={p.k} />
      <MText size="md" weight="extraBold">
        {t(`shell.nav.${p.k}`)}
      </MText>
    </Pressable>
  );
}

export function InicioAtajos({ onNavigate }: { onNavigate: (path: string) => void }): ReactElement {
  const { t } = useTranslation();
  return (
    <View role="navigation" aria-label={t('entrar.inicio.atajos')} flexDirection="row" gap={10}>
      {ATAJOS.map((a) => (
        <Atajo key={a.key} k={a.key} path={a.path} onNavigate={onNavigate} />
      ))}
    </View>
  );
}
