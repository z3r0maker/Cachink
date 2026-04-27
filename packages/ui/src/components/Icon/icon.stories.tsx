import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text, View } from '@tamagui/core';
import { Icon, type IconName } from './index';
import { colors, typography } from '../../theme';

const ALL_ICONS: readonly IconName[] = [
  'home',
  'layout-dashboard',
  'layout-grid',
  'settings',
  'ellipsis',
  'dollar-sign',
  'banknote',
  'wallet',
  'coins',
  'hand-coins',
  'credit-card',
  'receipt',
  'archive',
  'package',
  'scan-barcode',
  'shopping-bag',
  'chart-bar',
  'trending-up',
  'trending-down',
  'plus',
  'minus',
  'x',
  'check',
  'share-2',
  'pencil',
  'trash-2',
  'users',
  'user',
  'bell',
  'circle-alert',
  'info',
  'file-text',
  'chevron-up',
  'chevron-down',
  'chevron-left',
  'chevron-right',
];

const meta: Meta<typeof Icon> = {
  title: 'Phase 1A / Primitives / Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    name: { control: 'select', options: ALL_ICONS },
    size: { control: { type: 'number', min: 12, max: 64, step: 2 } },
    strokeWidth: { control: { type: 'number', min: 1, max: 4, step: 0.25 } },
    color: { control: 'color' },
  },
  args: { name: 'home', size: 24, strokeWidth: 2 },
};
export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {};

export const Primary: Story = {
  args: { name: 'dollar-sign', color: colors.black, size: 32 },
};

export const Danger: Story = {
  args: { name: 'circle-alert', color: colors.red, size: 32 },
};

export const Success: Story = {
  args: { name: 'check', color: colors.green, size: 32 },
};

/** Full catalog — designer visual review surface. */
export const AllIcons: Story = {
  render: () => (
    <View flexDirection="row" flexWrap="wrap" gap={16} padding={20} backgroundColor={colors.white}>
      {ALL_ICONS.map((name) => (
        <View
          key={name}
          alignItems="center"
          justifyContent="center"
          width={88}
          height={88}
          gap={8}
          backgroundColor={colors.offwhite}
          borderColor={colors.black}
          borderWidth={2}
          borderRadius={10}
        >
          <Icon name={name} size={28} color={colors.black} />
          <Text
            fontFamily={typography.fontFamily}
            fontSize={9}
            fontWeight={typography.weights.bold}
            letterSpacing={typography.letterSpacing.wide}
            color={colors.gray600}
            textAlign="center"
          >
            {name}
          </Text>
        </View>
      ))}
    </View>
  ),
};
