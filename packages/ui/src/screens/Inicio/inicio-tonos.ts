/**
 * «Lo primero»'s five tones (MvInicio's situations): the card's ground, the
 * glyph tile and its edge, the eyebrow and the body text. Every text colour
 * clears AA on its ground.
 */
import type { HeroTono } from '@xangarro/caja/inicio';
import { colors } from '../../theme';

export interface Tono {
  readonly fondo: string;
  readonly tile: string;
  readonly tileBorde: string;
  readonly ceja: string;
  readonly texto: string;
}

export const TONOS: Readonly<Record<HeroTono, Tono>> = {
  listo: {
    fondo: colors.yellow,
    tile: colors.white,
    tileBorde: colors.black,
    ceja: colors.ink,
    texto: colors.ink,
  },
  cerrado: {
    fondo: colors.white,
    tile: colors.yellowSoft,
    tileBorde: colors.black,
    ceja: colors.textMuted,
    texto: colors.gray600,
  },
  cerrar: {
    fondo: colors.warningSoft,
    tile: colors.yellow,
    tileBorde: colors.black,
    ceja: colors.warningText,
    texto: colors.ink,
  },
  aclarar: {
    fondo: colors.redSoft,
    tile: colors.white,
    tileBorde: colors.redText,
    ceja: colors.redText,
    texto: colors.ink,
  },
  offline: {
    fondo: colors.gray100,
    tile: colors.warningSoft,
    tileBorde: colors.warningText,
    ceja: colors.warningText,
    texto: colors.ink,
  },
};
