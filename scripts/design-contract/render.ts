/**
 * The generated halves of `DESIGN_CONTRACT.md`.
 *
 * The token tables are **generated, never typed**. A hand-maintained copy is
 * how the design system's own `colors_and_type.css` came to be missing eight
 * tokens and to colour body text with `gray400`, which the palette forbids for
 * text. Task P-19, ADR-057.
 */

import {
  borders,
  colors,
  emojiSizes,
  fontSizes,
  portalFontSizes,
  radii,
  denseRadii,
  shadows,
  shapeRadii,
  typography,
} from '../../packages/tokens/src/index';
import { CONDITIONS, HEADER, MOTION, PROHIBITIONS, VERIFICATION } from './prose';

function table(rows: readonly (readonly string[])[], head: readonly string[]): string {
  const sep = head.map(() => '---');
  return [head, sep, ...rows].map((r) => `| ${r.join(' | ')} |`).join('\n');
}

function colourRows(): readonly (readonly string[])[] {
  return Object.entries(colors).map(([name, value]) => [
    `\`${name}\``,
    `\`${value}\``,
    `\`--${name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()}\``,
  ]);
}

type Tokens = Readonly<Record<string, string | number>>;

/** `key value, key value`. */
function pairs(o: Tokens): string {
  return Object.entries(o)
    .map(([k, v]) => `${k} ${v}`)
    .join(', ');
}

/** `` `key` value `` — used where the name is the thing being cited. */
function pairsTickKey(o: Tokens): string {
  return Object.entries(o)
    .map(([k, v]) => `\`${k}\` ${v}`)
    .join(', ');
}

/** `` key `value` `` — used where the value is a literal to copy. */
function pairsTickValue(o: Tokens): string {
  return Object.entries(o)
    .map(([k, v]) => `${k} \`${v}\``)
    .join(', ');
}

function conditions(): readonly string[] {
  return [
    '## 1. Las ocho condiciones de réplica',
    '',
    'A screen is replicated when it satisfies all eight. Verify before closing any task.',
    '',
    ...CONDITIONS.map(([name, body], i) => `${i + 1}. **${name}.** ${body}`),
    '',
  ];
}

function prohibitions(): readonly string[] {
  return ['## 2. Prohibiciones', '', ...PROHIBITIONS.map((p) => `- ${p}`), ''];
}

function colour(): readonly string[] {
  return ['## 3. Color', '', table(colourRows(), ['Token', 'Value', 'CSS custom property']), ''];
}

function shape(): readonly string[] {
  return [
    '## 4. Shape',
    '',
    `**Radii** — the strict ladder, nothing else: ${radii.join(', ')}; plus the dense steps ${Object.values(denseRadii).join(' and ')} (ADR-076).`,
    '',
    `**Off-ladder shapes** (data-viz marks and full pills): ${pairsTickKey(shapeRadii)}.`,
    '',
    `**Borders** — only two widths exist: \`thin\` ${borders.thin}, \`thick\` ${borders.thick}.`,
    '',
    '**Shadows** — hard drops, zero blur, zero alpha:',
    '',
    table(
      Object.entries(shadows).map(([k, v]) => [`\`${k}\``, `\`${v}\``]),
      ['Token', 'Value'],
    ),
    '',
  ];
}

function type(): readonly string[] {
  return [
    '## 5. Type',
    '',
    `**Family** — \`${typography.fontFamily}\`, self-hosted. Anton for the wordmark only.`,
    '',
    `**Weights** — ${pairs(typography.weights)}. **800 is the portal's maximum**: Google Fonts tops out there and a 900 request renders as synthetic bold (ADR-058 §8).`,
    '',
    `**Mobile ramp** (\`fontSizes\`) — ${Object.values(fontSizes).join(', ')}.`,
    '',
    `**Portal ramp** (\`portalFontSizes\`) — ${Object.values(portalFontSizes).join(', ')}. Richer than the phone's, per the design handoff. **12 is the floor for both.**`,
    '',
    `**Emoji as illustration** — ${pairs(emojiSizes)}. Never dragged along by a type-scale change.`,
    '',
    `**Tracking** — ${pairsTickValue(typography.letterSpacing)}.`,
    '',
  ];
}

export function render(): string {
  return (
    [
      ...HEADER,
      ...conditions(),
      ...prohibitions(),
      ...colour(),
      ...shape(),
      ...type(),
      ...MOTION,
      ...VERIFICATION,
    ].join('\n') + '\n'
  );
}
