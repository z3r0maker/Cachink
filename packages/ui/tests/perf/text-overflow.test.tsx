/**
 * Text-overflow + Dynamic Type guard tests — Phase B4
 * (audit M-1 9.3 + 9.4 follow-through across 7 components beyond `<Btn>`).
 *
 * The audit's 9.3 / 9.4 work shipped on `<BtnLabel>` in PR 2.5 (T05 + T06).
 * Phase B4 extends the same `numberOfLines` + `ellipsizeMode` +
 * `maxFontSizeMultiplier` pattern to every other text-bearing primitive
 * that can be exposed to long Spanish strings or Dynamic Type scaling:
 *
 *   - `<SectionTitle>` — eyebrow label
 *   - `<Kpi>` — label, value, hint
 *   - `<Tag>` — pill chip
 *   - `<EmptyState>` — title + description
 *   - `<TopBar>` — title + subtitle
 *   - `<ModalHeader>` — title + subtitle
 *   - `<InitialsAvatar>` — initials text
 *
 * **Why a single perf-style test** — these props are tiny, the bug
 * surface is "did someone forget the prop on a new component", and
 * Tamagui compiles `numberOfLines` into a deterministic class shape
 * (`_textOverflow-ellipsis` + `_ws-nowrap` for one line; `_WebkitLineClamp-N`
 * for multi-line). One test file with one assertion per component
 * stops a future refactor from silently regressing the cap.
 *
 * **What we assert** — the compiled CSS class shape that Tamagui emits
 * for the `numberOfLines` prop. `maxFontSizeMultiplier` is RN-only
 * (react-native-web drops it because there's no Dynamic Type on web),
 * so we don't assert that on the DOM — the prop is in the source and
 * the typecheck plus visual review handle that side.
 */

import { describe, expect, it } from 'vitest';
import {
  EmptyState,
  InitialsAvatar,
  Kpi,
  Modal,
  SectionTitle,
  Tag,
  TopBar,
} from '../../src/components/index';
import { renderWithProviders, screen } from '../test-utils';

/** One-line clamp shape: `numberOfLines={1}` + `ellipsizeMode="tail"`. */
const ONE_LINE_CLAMP = /_textOverflow-ellipsis/;
const NOWRAP = /_ws-nowrap/;

/** Multi-line clamp shape: `numberOfLines={N}`. */
function multiLineClampMatcher(n: number): RegExp {
  return new RegExp(`_WebkitLineClamp-${n}`);
}

describe('Text overflow + clamp props (audit 9.3) across 7 primitives', () => {
  it('SectionTitle.title clamps at 1 line', () => {
    renderWithProviders(<SectionTitle title="Cuentas por Cobrar pendientes" />);
    const node = screen.getByTestId('section-title-text');
    expect(node.className).toMatch(ONE_LINE_CLAMP);
    expect(node.className).toMatch(NOWRAP);
  });

  it('Kpi.label clamps at 1 line and Kpi.value clamps at 1 line', () => {
    renderWithProviders(<Kpi label="Margen Operativo" value="$1,250,000.00" />);
    expect(screen.getByTestId('kpi-label').className).toMatch(ONE_LINE_CLAMP);
    expect(screen.getByTestId('kpi-value').className).toMatch(ONE_LINE_CLAMP);
  });

  it('Kpi.hint clamps at 2 lines', () => {
    renderWithProviders(
      <Kpi label="Stock bajo" value="3" hint="3 productos por debajo del umbral configurado" />,
    );
    expect(screen.getByTestId('kpi-hint').className).toMatch(multiLineClampMatcher(2));
  });

  it('Tag clamps at 1 line', () => {
    renderWithProviders(<Tag testID="tag-overflow">Materia Prima</Tag>);
    const root = screen.getByTestId('tag-overflow');
    // The clamp lives on the inner `<TagText>` Text node; introspect
    // children to get the rendered span.
    const textSpan = root.querySelector('span');
    expect(textSpan).not.toBeNull();
    expect(textSpan!.className).toMatch(ONE_LINE_CLAMP);
    expect(textSpan!.className).toMatch(NOWRAP);
  });

  it('EmptyState.title clamps at 2 lines and description clamps at 4 lines', () => {
    renderWithProviders(
      <EmptyState
        title="Sin ventas registradas"
        description="Cuando registres tu primera venta del día aparecerá aquí."
      />,
    );
    expect(screen.getByTestId('empty-state-title').className).toMatch(multiLineClampMatcher(2));
    expect(screen.getByTestId('empty-state-description').className).toMatch(
      multiLineClampMatcher(4),
    );
  });

  it('TopBar title + subtitle each clamp at 1 line', () => {
    renderWithProviders(
      <TopBar title="Buenos días, Pedro" subtitle="abril 2026 · 4 dispositivos" />,
    );
    expect(screen.getByTestId('top-bar-title').className).toMatch(ONE_LINE_CLAMP);
    expect(screen.getByTestId('top-bar-subtitle').className).toMatch(ONE_LINE_CLAMP);
  });

  it('ModalHeader title + subtitle each clamp at 1 line', () => {
    renderWithProviders(
      <Modal
        open
        title="Registrar pago de cliente"
        subtitle="24 abr · 10:48"
        onClose={() => undefined}
      >
        <span>body</span>
      </Modal>,
    );
    expect(screen.getByTestId('modal-title').className).toMatch(ONE_LINE_CLAMP);
    expect(screen.getByTestId('modal-subtitle').className).toMatch(ONE_LINE_CLAMP);
  });

  it('InitialsAvatar text clamps at 1 line (clip mode)', () => {
    renderWithProviders(<InitialsAvatar value="Pedro Espinoza" />);
    // `numberOfLines={1}` → same `_ws-nowrap` shape as
    // `ellipsizeMode="tail"`; `ellipsizeMode="clip"` differs only in
    // not adding `_textOverflow-ellipsis`. We assert nowrap as the
    // robust shared marker.
    expect(screen.getByTestId('initials-avatar-text').className).toMatch(NOWRAP);
  });
});
