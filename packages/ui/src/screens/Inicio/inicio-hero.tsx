/**
 * «Lo primero» (MvInicio's situations; the web's `HeroCard`): what to do
 * now, in the situation's tone, with one big action in reach. The words,
 * the glyph and the tone are `heroFor()` from the caja package; this draws
 * them. Cobrar is the black button with yellow words; the offline card's
 * action is white with «Seguir cobrando» under it. On a tablet the card lies
 * across (TbInicio).
 */
import type { ReactElement } from 'react';
import { Pressable } from 'react-native';
import { View } from '@tamagui/core';
import type { Hero, Nota } from '@xangarro/caja/inicio';
import { Btn, Eyebrow, MText, PathIcon } from '../../components/index';
import { borderWidths, colors, radii, shadows, shapeRadii } from '../../theme';
import { TONOS, type Tono } from './inicio-tonos';

const FLECHA = 'M5 12h14M13 6l6 6-6 6';

export interface InicioHeroProps {
  readonly hero: Hero;
  /** The big action; null hides it (a screen the phone doesn't have). */
  readonly onAccion: (() => void) | null;
  readonly onExtra?: () => void;
  readonly ancho?: boolean;
}

function NotaLinea({ nota, color }: { nota: Nota; color: string }): ReactElement {
  return (
    <MText size="sm" weight="semibold" color={color} textAlign="center">
      {nota.map((p, i) =>
        typeof p === 'string' ? (
          p
        ) : (
          <MText key={i} size="sm" weight="extraBold" fontVariant={['tabular-nums']}>
            {p.b}
          </MText>
        ),
      )}
    </MText>
  );
}

function CtaNegra(p: { label: string; onPress: () => void }): ReactElement {
  return (
    <Pressable
      testID="inicio-hero-accion"
      role="button"
      aria-label={p.label}
      onPress={p.onPress}
      style={({ pressed }) => ({
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        borderRadius: radii[4],
        borderWidth: borderWidths.thick,
        borderColor: colors.black,
        backgroundColor: colors.black,
        transform: pressed ? [{ translateX: 2 }, { translateY: 2 }] : [],
      })}
    >
      <MText size="cardTitle" weight="extraBold" color={colors.yellow} letterSpacing={-0.4}>
        {p.label}
      </MText>
      <PathIcon d={FLECHA} size={22} strokeWidth={2.6} color={colors.yellow} />
    </Pressable>
  );
}

function Accion(p: InicioHeroProps): ReactElement | null {
  const { hero, onAccion } = p;
  if (onAccion === null) return null;
  if (hero.tono === 'listo') return <CtaNegra label={hero.cta} onPress={onAccion} />;
  const variant = hero.tono === 'offline' ? 'secondary' : 'primary';
  return (
    <Btn
      variant={variant}
      size="xl"
      fullWidth
      sentence
      onPress={onAccion}
      testID="inicio-hero-accion"
    >
      {hero.cta}
    </Btn>
  );
}

function Cabeza({ hero, tono }: { hero: Hero; tono: Tono }): ReactElement {
  return (
    <View flexDirection="row" alignItems="center" gap={12}>
      <View
        width={48}
        height={48}
        alignItems="center"
        justifyContent="center"
        borderRadius={radii[3]}
        borderWidth={borderWidths.thin}
        borderColor={tono.tileBorde}
        backgroundColor={tono.tile}
      >
        <PathIcon d={hero.icon} size={22} color={tono.tileBorde} />
      </View>
      <View flex={1} minWidth={0} gap={2}>
        <View flexDirection="row" alignItems="center" gap={8} flexWrap="wrap">
          <Eyebrow color={tono.ceja}>{hero.eyebrow}</Eyebrow>
          {hero.chip ? <Pildora texto={hero.chip} /> : null}
        </View>
        <MText size="xl2" weight="extraBold" letterSpacing={-0.6}>
          {hero.title}
        </MText>
      </View>
    </View>
  );
}

function Pildora({ texto }: { texto: string }): ReactElement {
  return (
    <View
      height={24}
      justifyContent="center"
      paddingHorizontal={8}
      borderRadius={shapeRadii.pill}
      borderWidth={borderWidths.thin}
      borderColor={colors.warningText}
      backgroundColor={colors.warningSoft}
    >
      <MText size="xs" weight="extraBold" color={colors.warningText}>
        {texto}
      </MText>
    </View>
  );
}

function Extra(p: { label: string; onPress: () => void }): ReactElement {
  return (
    <Btn variant="quiet" size="md" onPress={p.onPress} testID="inicio-hero-extra">
      {p.label}
    </Btn>
  );
}

export function InicioHero(p: InicioHeroProps): ReactElement {
  const tono = TONOS[p.hero.tono];
  const lado = (
    <View gap={8} width={p.ancho ? 300 : undefined}>
      <Accion {...p} />
      {p.hero.nota ? <NotaLinea nota={p.hero.nota} color={tono.texto} /> : null}
      {p.hero.extra && p.onExtra ? <Extra label={p.hero.extra.label} onPress={p.onExtra} /> : null}
    </View>
  );
  return (
    <View
      testID={`inicio-hero-${p.hero.tono}`}
      role="region"
      aria-label={p.hero.eyebrow}
      flexDirection={p.ancho ? 'row' : 'column'}
      alignItems={p.ancho ? 'center' : 'stretch'}
      gap={p.ancho ? 20 : 12}
      padding={16}
      borderRadius={radii[7]}
      borderWidth={borderWidths.thick}
      borderColor={colors.black}
      backgroundColor={tono.fondo}
      style={{ boxShadow: shadows.card }}
    >
      <View flex={p.ancho ? 1 : undefined} gap={8}>
        <Cabeza hero={p.hero} tono={tono} />
        <MText size="md" weight="semibold" color={tono.texto}>
          {p.hero.body}
        </MText>
      </View>
      {lado}
    </View>
  );
}
