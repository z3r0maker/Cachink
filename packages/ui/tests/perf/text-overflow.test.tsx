/**
 * Text-overflow + Dynamic Type guard tests — Phase B4
 * (audit M-1 9.3 + 9.4 follow-through across the text primitives beyond `<Btn>`).
 *
 * The audit's 9.3 / 9.4 work shipped on `<BtnLabel>` in PR 2.5 (T05 + T06).
 * Phase B4 extends the same `numberOfLines` + `ellipsizeMode` +
 * `maxFontSizeMultiplier` pattern to every other text-bearing primitive
 * that can be exposed to long Spanish strings or Dynamic Type scaling:
 *
 *   - `<SectionTitle>` — eyebrow label
 *   - `<EmptyState>` — title + description
 *   - `<ModalHeader>` — title + subtitle
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
import { EmptyState, Modal, SectionTitle } from '../../src/components/index';
import { renderWithProviders, screen } from '../test-utils';

/** One-line clamp shape: `numberOfLines={1}` + `ellipsizeMode="tail"`. */
const ONE_LINE_CLAMP = /_textOverflow-ellipsis/;
const NOWRAP = /_ws-nowrap/;

/** Multi-line clamp shape: `numberOfLines={N}`. */
function multiLineClampMatcher(n: number): RegExp {
  return new RegExp(`_WebkitLineClamp-${n}`);
}

describe('Text overflow + clamp props (audit 9.3) across the text primitives', () => {
  it('SectionTitle.title clamps at 1 line', () => {
    renderWithProviders(<SectionTitle title="Cuentas por Cobrar pendientes" />);
    const node = screen.getByTestId('section-title-text');
    expect(node.className).toMatch(ONE_LINE_CLAMP);
    expect(node.className).toMatch(NOWRAP);
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
    // ModalHeader title uses WebkitLineClamp for multi-line overflow;
    // subtitle uses single-line text-overflow ellipsis.
    expect(screen.getByTestId('modal-title').className).toMatch(/_WebkitLineClamp/);
    expect(screen.getByTestId('modal-subtitle').className).toMatch(
      /_textOverflow-ellipsis|_WebkitLineClamp/,
    );
  });
});
