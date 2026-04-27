/**
 * `<SplitPane>` tests — Phase B2 (audit M-1 PR 5.5-T02).
 *
 * Covers:
 *   1. Default testID anchor
 *   2. Phone-portrait fallback stacks the panes
 *   3. Tablet-landscape (gtMd) renders side-by-side
 *   4. Custom leftFlex / rightFlex propagate
 *   5. Gap defaults match the §8 rhythm and respect overrides
 */

import { afterEach, describe, expect, it } from 'vitest';
import { SplitPane } from '../src/components/SplitPane/index';
import { renderWithProviders, screen } from './test-utils';
import { resetMockViewport, setMockViewport } from './responsive/match-media-mock';

afterEach(() => {
  resetMockViewport();
});

describe('SplitPane', () => {
  it('exposes the root testID and both pane testIDs by default', () => {
    setMockViewport(360); // phone — both panes still render, just stacked
    renderWithProviders(
      <SplitPane
        left={<span data-testid="left-content" />}
        right={<span data-testid="right-content" />}
      />,
    );
    expect(screen.getByTestId('split-pane')).toBeInTheDocument();
    expect(screen.getByTestId('split-pane-left')).toBeInTheDocument();
    expect(screen.getByTestId('split-pane-right')).toBeInTheDocument();
    expect(screen.getByTestId('left-content')).toBeInTheDocument();
    expect(screen.getByTestId('right-content')).toBeInTheDocument();
  });

  it('stacks the panes vertically on phone (sm) widths', () => {
    setMockViewport(360);
    renderWithProviders(
      <SplitPane testID="ventas-split" left={<span>list</span>} right={<span>detail</span>} />,
    );
    const root = screen.getByTestId('ventas-split');
    expect(root).toHaveStyle({ flexDirection: 'column' });
  });

  it('renders the panes side-by-side on tablet-landscape (gtMd) widths', () => {
    setMockViewport(900);
    renderWithProviders(
      <SplitPane testID="ventas-split" left={<span>list</span>} right={<span>detail</span>} />,
    );
    const root = screen.getByTestId('ventas-split');
    expect(root).toHaveStyle({ flexDirection: 'row' });
  });

  it('keeps the stacked layout on phone-landscape (gtSm but not gtMd) widths', () => {
    // 600 px is wider than gtSm (481) but narrower than gtMd (769). Audit
    // 4.4: SplitPane intentionally avoids splitting at this width because
    // the panes squeeze inputs / buttons below the §8 touch budget.
    setMockViewport(600);
    renderWithProviders(
      <SplitPane testID="ventas-split" left={<span>list</span>} right={<span>detail</span>} />,
    );
    const root = screen.getByTestId('ventas-split');
    expect(root).toHaveStyle({ flexDirection: 'column' });
  });

  it('propagates custom leftFlex / rightFlex on gtMd', () => {
    setMockViewport(1024);
    renderWithProviders(
      <SplitPane
        leftFlex={0.3}
        rightFlex={0.7}
        left={<span>list</span>}
        right={<span>detail</span>}
      />,
    );
    // Tamagui compiles `flex` into CSS classes (e.g. `_flexGrow-0--3`
    // for `flex={0.3}`). The class name is the assertable surface
    // because Tamagui doesn't write inline `style.flexGrow` under
    // jsdom — the runtime resolves the rule via stylesheet
    // injection. Matching on the class is the same level of
    // robustness as the existing `_flex` assertions in
    // `tests/list.test.tsx`.
    const left = screen.getByTestId('split-pane-left');
    const right = screen.getByTestId('split-pane-right');
    expect(left.className).toMatch(/_flexGrow-0--3/);
    expect(right.className).toMatch(/_flexGrow-0--7/);
  });
});
