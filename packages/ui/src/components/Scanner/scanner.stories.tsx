/**
 * Storybook catalog for the `<Scanner>` primitive.
 *
 * `<Scanner>` is a platform-extension component (web + native variants
 * — ADR-022). Storybook resolves the web variant via Vite, which uses
 * the BarcodeDetector API. The stories below render the open and
 * closed states; the actual camera stream isn't usable in a Storybook
 * iframe so the open state shows the brand chrome only. Audit Round 2
 * G2.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { View } from '@tamagui/core';
import { Btn } from '../Btn/index';
import { Scanner } from './scanner';

const meta: Meta<typeof Scanner> = {
  title: 'Phase 1C / Primitives / Scanner',
  component: Scanner,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Scanner>;

/** Closed — the trigger Btn that opens the scanner overlay. */
export const Closed: Story = {
  render: () => (
    <View padding={16}>
      <Btn variant="ghost">Escanear código</Btn>
    </View>
  ),
};

/** Open (single mode) — single-scan, closes after the first detection. */
export const OpenSingle: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <View padding={16}>
        <Scanner
          open={open}
          mode="single"
          onClose={() => setOpen(false)}
          onScan={() => setOpen(false)}
        />
      </View>
    );
  },
};

/** Open (continuous mode) — keeps the scanner open across multiple scans. */
export const OpenContinuous: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    return (
      <View padding={16}>
        <Scanner open={open} mode="continuous" onClose={() => setOpen(false)} onScan={() => {}} />
      </View>
    );
  },
};
