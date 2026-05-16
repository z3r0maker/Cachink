/**
 * Test mock for react-native-svg.
 *
 * The native `react-native-svg` package ships TypeScript source in its
 * `"react-native"` field and native-only Fabric components in its
 * compiled bundles — neither of which Vite/Vitest can parse or resolve.
 *
 * Chart components (`Sparkline`, `WaterfallChart`, etc.) import SVG
 * primitives (Svg, Rect, Circle, etc.) but we don't need actual SVG
 * rendering in jsdom unit tests — we only test structure and wiring.
 * This mock replaces every SVG primitive with a simple `<div>`.
 */

import React from 'react';

type SvgMockProps = Record<string, unknown> & { children?: React.ReactNode };

function createMockComponent(name: string) {
  const MockComponent = React.forwardRef<HTMLDivElement, SvgMockProps>(
    (props, ref) =>
      React.createElement('div', { ref, 'data-testid': `svg-mock-${name}`, ...filterProps(props) }, props.children),
  );
  MockComponent.displayName = name;
  return MockComponent;
}

/** Strip non-DOM-safe props that would warn in jsdom. */
function filterProps(props: SvgMockProps): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(props)) {
    if (k === 'children') continue;
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
      safe[k] = v;
    }
  }
  return safe;
}

export const Svg = createMockComponent('Svg');
export const Circle = createMockComponent('Circle');
export const Rect = createMockComponent('Rect');
export const Line = createMockComponent('Line');
export const Polyline = createMockComponent('Polyline');
export const Polygon = createMockComponent('Polygon');
export const Path = createMockComponent('Path');
export const Text = createMockComponent('Text');
export const G = createMockComponent('G');
export const Defs = createMockComponent('Defs');
export const ClipPath = createMockComponent('ClipPath');
export const LinearGradient = createMockComponent('LinearGradient');
export const RadialGradient = createMockComponent('RadialGradient');
export const Stop = createMockComponent('Stop');
export const Use = createMockComponent('Use');
export const Symbol = createMockComponent('Symbol');
export const Mask = createMockComponent('Mask');
export const TSpan = createMockComponent('TSpan');

export default Svg;
