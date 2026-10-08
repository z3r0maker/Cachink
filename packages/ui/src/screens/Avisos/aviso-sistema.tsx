/**
 * A notice the caja raised (MvAvisos «De tu caja»; the web's `sistema.tsx`):
 * its glyph on the tone's tint, kind · time · «Sin leer», what happened and,
 * when there is something to do, the button to the phone screen that does it
 * (Inventario, Registros por enviar, Fiado y abonos). Following it marks the
 * notice read.
 */
import type { ReactElement } from 'react';
import { View } from '@tamagui/core';
import type { Aviso, AvisoTono } from '@xangarro/caja/avisos';
import { Btn, GLYPHS, MText, PathIcon } from '../../components/index';
import { borderColors, borderWidths, colors, radii, shapeRadii } from '../../theme';

const TINTE: Readonly<Record<AvisoTono, string>> = {
  alerta: colors.redSoft,
  dueno: colors.yellowSoft,
  atencion: colors.warningSoft,
  info: colors.blueSoft,
  hecho: colors.greenSoft,
};

function SinLeer(): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={5}>
      <View
        width={9}
        height={9}
        borderRadius={shapeRadii.pill}
        borderWidth={borderWidths.quiet}
        borderColor={colors.black}
        backgroundColor={colors.yellow}
      />
      <MText size="xs" weight="extraBold">
        Sin leer
      </MText>
    </View>
  );
}

const TARJETA = {
  gap: 12,
  padding: 14,
  borderRadius: radii[6],
  borderWidth: borderWidths.quiet,
  borderColor: borderColors.quiet,
  backgroundColor: colors.white,
} as const;

const TILE = {
  width: 48,
  height: 48,
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: radii[3],
  borderWidth: borderWidths.thin,
  borderColor: colors.black,
} as const;

function Texto({ aviso }: { readonly aviso: Aviso }): ReactElement {
  return (
    <View flex={1} minWidth={0} gap={4}>
      <View flexDirection="row" alignItems="center" flexWrap="wrap" gap={6}>
        <MText size="xs" weight="extraBold" letterSpacing={1.2} color={colors.textMuted}>
          {aviso.tipo.toUpperCase()}
        </MText>
        <MText size="xs" color={colors.textMuted} fontVariant={['tabular-nums']}>
          {`· ${aviso.hora}`}
        </MText>
        {aviso.leido ? null : <SinLeer />}
      </View>
      <MText size="lg" weight="extraBold">
        {aviso.titulo}
      </MText>
      <MText size="md" weight="semibold" color={colors.gray600} lineHeight={20}>
        {aviso.cuerpo}
      </MText>
    </View>
  );
}

export function AvisoSistema(p: {
  readonly aviso: Aviso;
  /** The phone route for the notice's action; null when the phone has none. */
  readonly ruta: string | null;
  readonly onIr: (ruta: string) => void;
}): ReactElement {
  const { aviso, ruta } = p;
  return (
    <View testID={`aviso-${aviso.id}`} role="article" aria-label={aviso.titulo} {...TARJETA}>
      <View flexDirection="row" alignItems="flex-start" gap={12}>
        <View {...TILE} backgroundColor={TINTE[aviso.tono]} aria-hidden>
          <PathIcon d={aviso.icono} size={22} />
        </View>
        <Texto aviso={aviso} />
      </View>
      {aviso.cta && ruta ? (
        <Btn
          variant="secondary"
          size="lg"
          sentence
          fullWidth
          onPress={() => p.onIr(ruta)}
          icon={<PathIcon d={GLYPHS.chevronRight} size={16} strokeWidth={2.4} />}
          testID={`aviso-ir-${aviso.id}`}
        >
          {aviso.cta.label}
        </Btn>
      ) : null}
    </View>
  );
}
