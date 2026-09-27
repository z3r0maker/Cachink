# El Mostrador — the style guide

> The design language of every Xangarro surface: the portal, the web caja and the phone app
> (ADR-109, building on ADR-107). UI terms are in Spanish because that is what the screens say;
> the prose is English, like the rest of `docs/`.

**The spec is the canvas.** The El Mostrador boards on the design canvas
(https://claude.ai/artifact/DxbWpgBQRbix3mpXnnysyt), approved by the owner board by board, are the
specification. Code translates them into `@xangarro/tokens` and the shared components; it never
copies a board's pixels, example names or amounts. `DESIGN_CONTRACT.md` holds the generated token
tables; this guide holds the rules.

---

## 1. Surfaces

- **The page is `colors.gray200`** (`styles/global.css.ts`, both shells). Not `offwhite`.
- **Everything sits on a quiet panel**: white, `borders.quiet`, radius 20, no shadow.
- **One hero per screen**: the thing the screen is about (the turno, the cierre, the plan). Thick
  black border and hard shadow. Heroes never nest.
- **Black means "you can act on this"** (ADR-107): buttons, inputs, selected options, dialogs and
  panels keep the black edge; read-only surfaces never borrow it.

```ts
// portal: components/card.css.ts
card({ emphasis: 'quiet' }); // border: borders.quiet, borderRadius: radii[6] (20), no shadow
card({ tone: 'hero', emphasis: 'hero' }); // borders.thick, radii[5], shadows.hero, once per screen
// caja: operador/ui/panel.tsx
<Panel …>{rows}</Panel>; // the quiet panel with its eyebrow head
```

## 2. Selection

| Control                                 | Selected                                  | Where                                                   |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------- |
| Filter chip, radio chip                 | `colors.black` fill, `colors.yellow` text | `operador/ui/filters.css.ts`, `mostrador.css.ts` `chip` |
| Tab, segmented control                  | `colors.yellow` fill                      | `operador/ui/tabs.css.ts`, `SegmentedTabs`              |
| Option card (≤ 5 choices, CLAUDE.md §6) | `colors.yellow` fill                      | `components/option-card.css.ts`                         |

A **yellow-filled chip is not a selection style**. Yellow on a chip reads as a button or a hero.

## 3. Buttons

| Kind        | Look                                                    | Portal (`button.css.ts`) | Caja (`mostrador.css.ts` `boton`) |
| ----------- | ------------------------------------------------------- | ------------------------ | --------------------------------- |
| Primary     | `yellow`, black border, hard shadow; hover `yellowDeep` | `primary`                | `primario`                        |
| Secondary   | `white`, 2 px black (`borders.thin`)                    | `secondary`              | `secundario`                      |
| Quiet       | `white`, `borders.quiet`, `gray600` text                | `ghost`                  | `quieto`                          |
| Destructive | red text and edge; filled red to confirm                | `danger`                 | `peligro`, `peligroLleno`         |

- A disabled confirm is `gray100` with `textMuted`, no shadow.
- **Every action is a button** (or a link styled as one). Never a bare text link, never a raw
  URL on screen: «Ver ventas», not `xangarro.mx/ventas`.
- Everything pressable carries `pressable` (`styles/press.css.ts`): the stamp from
  `pressTransform`.

## 4. Panels and dialogs

- **Details and forms open in a side panel** on the web (`components/drawer.tsx` in the portal,
  `operador/ui/lateral.tsx` in the caja), **a bottom sheet** on the phone.
- **Confirmations are centred dialogs**: `ConfirmDialog` (portal), `DialogoMostrador` / `OpModal`
  (caja). White card, `borders.thick`, `shadows.hero`, over `colors.scrim`.
- Radix supplies the focus trap, Escape and the backdrop close. Never hand-roll them.

**z-index ladders** (verified in code, 2026-09-27). Each surface keeps its own; a new overlay
takes a rung, never an arbitrary number.

| Portal                        | z          | Caja (operador)                              | z          |
| ----------------------------- | ---------- | -------------------------------------------- | ---------- |
| Header                        | 30         | Header                                       | 30         |
| Drawer scrim, panel           | 40, 41     | Cobrar's total bar, ticket sheet (< 1240 px) | 45, 50     |
| Dialog scrim, card; user menu | 50, 51; 50 | Tab bar; side panel scrim, panel             | 60; 60, 61 |
| Command palette               | 60, 61     | Toast                                        | 70         |
|                               |            | Dialogs (scrim, card)                        | 80, 81     |
|                               |            | Lock screen                                  | 90         |

## 5. Don Cuentas

- **Only at key moments**: the greeting, a cierre que cuadra, a faltante, help, empty states and
  the plan lock (`LockedState`). **One Don per screen.**
- **Poses** (`components/don/don.tsx`): `hola` greets, `quieto` listens and blinks, `pensando`
  gives tips, `contando` is the loader, `celebrando` marks a win, `preocupado` flags a problem,
  `senalando` points the way, `ayuda` is help, `caminando` walks through a guide.
- **He never gives business advice to the operator.** The operator is told what happened
  («Te faltan $120.00»), not what the business should do. Advice is the owner's (Asesor).
- His motion (`saluda`, `respira`, `asiente`, `salta`, `duda`, `camina`) stops under
  reduced motion; the pose alone must still say what he means.

```tsx
<Don pose="celebrando" size={132} />
<DonDice pose="preocupado">Te faltan $120.00 en el cajón.</DonDice>
```

## 6. Motion

Four motions, nothing else. All of them are wrapped in `@media (prefers-reduced-motion: reduce)`.

| Motion      | What                                                       | Source                                      |
| ----------- | ---------------------------------------------------------- | ------------------------------------------- |
| Press       | `translate(2px, 2px)`, shadow to `shadows.pressed`, 100 ms | `pressTransform`, `pressable`               |
| Panel slide | side panel in from the right, 280 ms, scrim fades 160 ms   | `drawer.css.ts`, `lateral.css.ts`           |
| Dialog pop  | scale from 0.94–0.96, 160–220 ms                           | `dialog.css.ts`, `dialogo-mostrador.css.ts` |
| Don idle    | his pose's loop; the loader's coin toss                    | `don.css.ts`, `DonCargando`                 |

Cards may still lift on hover on desktop (`liftOnHover`). No shimmer, no spinner.

## 7. Contrast

- **4.5:1 minimum** for all text.
- **On the `gray200` page, muted text is `gray600`** (5.43:1). `textMuted` is 3.96:1 there and
  fails; it is only for white and `gray100` surfaces.
- `gray400` is never text. Semantic colours as text use their `*Text` pair (`redText`,
  `greenText`…), and those pairs are for panels too: on `gray200` they fall to 3.96–4.20:1.

## 8. Data states

- **A live screen never shows fixture data.** Fixtures feed Storybook, tests and the state
  preview, never a route that a customer can open.
- Every list and report implements loading, empty, error and with-data from the shared
  components: `DonCargando` / `LoadingState`, `EmptyState`, `ErrorState` (portal), `OperadorEstado`
  (`operador/estado.tsx`, caja).
- **Nothing is labelled «Pronto» or «Próximamente».** A feature that is not built is omitted:
  no card, no tab, no disabled button (owner decision, ADR-109; supersedes ADR-059's
  `ProximamenteState` gate).

## 9. Touch and accessibility

- **44 px minimum** targets everywhere; on tablet, catalogue tiles ≥ 96 px and quantity steppers
  44 px.
- Real elements: `<button>` for actions, `<a>` for navigation, `<label>` for every field.
- `aria-label` on every icon-only button (`a11y/icon-only-unlabeled` in design-lint).
- Focus ring: `3px solid colors.yellow`, black on yellow surfaces (`data-onyellow`), from
  `styles/global.css.ts`.
- Severity is never colour alone: an icon or a word goes with it.

## 10. The caja

- **Web keyboard** (`operador/caja/atajos.ts`): type anywhere to search, Enter adds the first
  match, + and − change the last line, F2 or Ctrl+Enter cobra, Esc steps back. Nothing fires
  while another field or a dialog has focus.
- **Phone**: four tabs, **Inicio, Cobrar, Ventas, Mi turno** (`TABBAR_ITEMS` in
  `operador/shell/nav.ts`); everything else is reached from Inicio and Mi turno. Details and forms
  are bottom sheets.
- **Breakpoints** (canvas spec, phone app and caja):

  | Width       | Navigation                |
  | ----------- | ------------------------- |
  | < 760 px    | bottom tab bar            |
  | 760–1279 px | 88 px icon rail + top bar |
  | ≥ 1280 px   | full 264 px sidebar       |

  The web caja today has the tab bar below 760 px and a 248 px sidebar above; the rail is still
  to come.

## 11. Copy

- **Spanish (México), tú.** «Cobra», «Tu turno», never «usted».
- **No em dashes in visible text.** Use a period, a comma or «·». The lone «—» that marks an
  empty cell is the only exception.
- **Payment methods, exactly**: Efectivo, Tarjeta, Transferencia, Fiado. Never «QR/CoDi», never
  «Crédito» (a historical QR/CoDi ticket reads «Transferencia»).
- **Names**: the device is **«la caja»**; the owner's people section is **«Equipo y nómina»**;
  merma is **«Se echó a perder o se dañó (merma)»**; an entrada is **«Llegó mercancía»**.
- **Money** `$1,234.00`, formatted with `@xangarro/domain` at the edge. **Dates**
  «31 de julio de 2026».
- No hard-coded business data: the caja's name, the operator's name and the business come from the
  session, never a literal like «Caja 1».

## 12. Workflow

1. Draw the change on the canvas; the owner approves the board.
2. Translate it into tokens and shared components. A new colour, width, radius or shadow goes into
   `packages/tokens` first, with a comment saying what it is for.
3. `pnpm lint:design` passes (a ratchet at zero), and `pnpm design:contract` is regenerated if a
   token changed.
4. The Playwright spec for the screen asserts real data reached it.
