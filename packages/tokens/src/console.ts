import { colors } from './colors.js';

/**
 * The internal console's two themes (backoffice, «Torre de Control»).
 *
 * The console runs dark: a night-shift ops room where yellow means «needs
 * you» and the status lights (ok / warn / bad / off) carry the state. Its
 * sign-in pages stay on the light brand, so both sets exist and name the same
 * roles. They are roles, not colours — `surface`, `line`, `dim` — so a screen
 * written once reads right in either.
 *
 * Dark contrast on `surface` (WCAG): `text` 18.0:1, `body` 16.0:1, `dim`
 * 7.1:1, `ok` 8.3:1, `warn` 10.4:1, `bad` 5.9:1, `off` 5.3:1 — every text role
 * clears 4.5:1 on `raised` too (`tests/console.test.ts` holds both themes to it).
 */
export interface ConsoleTheme {
  /** The page behind everything. */
  readonly bg: string;
  /** Panels, cards, table bodies, inputs. */
  readonly surface: string;
  /** A panel inside a panel; hover rows; disabled fills. */
  readonly raised: string;
  /** Every border. */
  readonly line: string;
  /** Row separators inside a panel. */
  readonly lineSoft: string;
  /** Headings and figures. */
  readonly text: string;
  /** Running text. */
  readonly body: string;
  /** Labels, captions, secondary facts. */
  readonly dim: string;
  /** The brand yellow: current page, primary action, «needs you». */
  readonly accent: string;
  /** Text on `accent`. */
  readonly onAccent: string;
  /** The hard shadow under pressable things. */
  readonly shade: string;
  /** Behind a drawer or dialog: dims the page enough to read as «not now». */
  readonly scrim: string;
  readonly ok: string;
  readonly warn: string;
  readonly bad: string;
  readonly off: string;
  readonly okSoft: string;
  readonly warnSoft: string;
  readonly badSoft: string;
  readonly infoSoft: string;
  readonly accentSoft: string;
  /** The map's four activity steps, faint to hot. */
  readonly heat1: string;
  readonly heat2: string;
  readonly heat3: string;
  readonly heat4: string;
}

export const consoleTheme: { readonly light: ConsoleTheme; readonly dark: ConsoleTheme } = {
  light: {
    bg: colors.gray200,
    surface: colors.white,
    raised: colors.gray100,
    line: colors.black,
    lineSoft: colors.gray200,
    text: colors.black,
    body: colors.ink,
    dim: colors.gray600,
    accent: colors.yellow,
    onAccent: colors.black,
    shade: colors.black,
    scrim: colors.scrim,
    ok: colors.greenText,
    warn: colors.warningText,
    bad: colors.redText,
    off: colors.textMuted,
    okSoft: colors.greenSoft,
    warnSoft: colors.warningSoft,
    badSoft: colors.redSoft,
    infoSoft: colors.blueSoft,
    accentSoft: colors.yellowSoft,
    heat1: colors.yellowSoft,
    heat2: colors.yellow,
    heat3: colors.warningSoft,
    heat4: colors.redSoft,
  },
  dark: {
    bg: colors.black,
    surface: '#171715',
    raised: '#1F1F1C',
    line: '#34342F',
    lineSoft: '#262622',
    text: colors.white,
    body: '#F2F2F0',
    dim: '#A3A39E',
    accent: colors.yellow,
    onAccent: colors.black,
    shade: colors.white,
    scrim: 'rgba(0, 0, 0, 0.62)',
    ok: colors.green,
    warn: colors.warning,
    bad: '#FF5B67',
    off: '#8C8C86',
    okSoft: '#0E2A22',
    warnSoft: '#2A2310',
    badSoft: '#2E1517',
    infoSoft: '#151D33',
    accentSoft: '#26230F',
    heat1: '#4A3F0A',
    heat2: '#8A730A',
    heat3: '#C9A40A',
    heat4: colors.yellow,
  },
};
