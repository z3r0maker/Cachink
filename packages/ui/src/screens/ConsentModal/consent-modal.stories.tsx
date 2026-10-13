/**
 * Storybook catalog for `<ConsentModal>` — the first-launch crash-reporting
 * opt-in (ADR-027 / Slice 4 C-15).
 *
 * Exists primarily so the Playwright + Storybook visual-snapshot pipeline
 * catches modal-positioning regressions on every PR. The screenshot
 * captured here at default Storybook viewports must show the modal
 * centered and inside the viewport — if a future change pushes it
 * off-screen (as the transform-based centering bug did), this story's
 * baseline diff will fail.
 */
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { initI18n } from '../../i18n/index';
import { ConsentModal } from './consent-modal';

initI18n();

const meta: Meta<typeof ConsentModal> = {
  title: 'Phase 1C / Screens / ConsentModal',
  component: ConsentModal,
  tags: ['autodocs'],
};
export default meta;
type Story = StoryObj<typeof ConsentModal>;

function ControlledConsent(): ReturnType<typeof ConsentModal> {
  const [open, setOpen] = useState<boolean>(true);
  return <ConsentModal open={open} onChange={() => setOpen(false)} />;
}

export const Open: Story = { render: () => <ControlledConsent /> };
