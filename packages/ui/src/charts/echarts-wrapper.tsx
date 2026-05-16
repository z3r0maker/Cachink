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
import ReactEChartsCore from 'echarts-for-react/lib/core';

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
  color: ['#00C896', '#FF4757', '#3B6FFF', '#FFB800', '#8B5CF6', '#0EA5E9'],
  backgroundColor: 'transparent',
  textStyle: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: '#1A1A18',
  },
  bar: {
    itemStyle: {
      borderColor: '#0D0D0D',
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
      borderColor: '#0D0D0D',
      borderWidth: 2,
    },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: '#E4E4E0' } },
    axisTick: { show: false },
    axisLabel: {
      color: '#5A5A56',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 11,
    },
  },
  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#5A5A56',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      fontSize: 11,
    },
    splitLine: { lineStyle: { color: '#F2F2F0' } },
  },
});

export { echarts, ReactEChartsCore };
