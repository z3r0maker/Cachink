/**
 * echarts-wrapper.tsx — Tree-shaken ECharts core + Cachink neobrutalist theme.
 *
 * Only imports the chart types we actually use to keep the bundle ~150KB.
 * Desktop only — Metro resolves .native.tsx files and never touches this.
 */
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
/*
 * `esm/core`, not `lib/core`. Both exist in the package: `lib/` is CommonJS,
 * `esm/` is real ESM with a plain `export default`. Importing the CJS path
 * leaves the default export as a module namespace object under some bundler
 * interop settings, and React then throws "Element type is invalid ... got:
 * object" — which is what every chart story did. The ESM path needs no
 * interop, so it behaves the same in Vite, Vitest, Storybook and Metro.
 * Audit 2026-09.
 */
import ReactEChartsCore from 'echarts-for-react/esm/core';
import { colors, fontSizes, typography } from '../theme';

// Register only the pieces we need
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DatasetComponent,
  CanvasRenderer,
]);

// Cachink neobrutalist theme
echarts.registerTheme('cachink', {
  color: [colors.green, colors.red, colors.blue, colors.warning, colors.purple, colors.cyan],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: typography.fontFamily,
    color: colors.ink,
  },
  bar: {
    itemStyle: {
      borderColor: colors.black,
      borderWidth: 2,
      borderRadius: [4, 4, 0, 0],
    },
  },
  line: {
    itemStyle: { borderWidth: 0 },
    lineStyle: { width: 2 },
    symbol: 'circle',
    symbolSize: 4,
  },
  pie: {
    itemStyle: {
      borderColor: colors.black,
      borderWidth: 2,
    },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: colors.gray200 } },
    axisTick: { show: false },
    axisLabel: {
      color: colors.gray600,
      fontFamily: typography.fontFamily,
      fontSize: fontSizes.xs,
    },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: colors.gray600,
      fontFamily: typography.fontFamily,
      fontSize: fontSizes.xs,
    },
    splitLine: { lineStyle: { color: colors.gray100 } },
  },
});

export { echarts, ReactEChartsCore };
