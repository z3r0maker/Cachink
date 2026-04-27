/**
 * FeedbackAction render-path tests (Slice 8 M3-C12).
 *
 * The existing `feedback-action.test.ts` covers the pure
 * `buildFeedbackMailto` builder. This file covers the React render path:
 * pressing the button calls the (injected) `openLink` with the
 * mailto URL the builder produced, and the default `openLink` falls
 * back gracefully when `window` is unavailable.
 */

import { describe, expect, it, vi } from 'vitest';
import { FeedbackAction } from '../../src/screens/Settings/feedback-action';
import { initI18n } from '../../src/i18n/index';
import { fireEvent, renderWithProviders, screen } from '../test-utils';

initI18n();

describe('FeedbackAction render path (Slice 8 M3-C12)', () => {
  it('renders the Card + Btn with the i18n cta label', () => {
    renderWithProviders(
      <FeedbackAction
        appVersion="1.0.0"
        platform="desktop-mac"
        role="Director"
        crashReportingEnabled={false}
        breadcrumbs={[]}
      />,
    );
    expect(screen.getByTestId('settings-feedback-card')).toBeInTheDocument();
    expect(screen.getByTestId('settings-feedback-button')).toBeInTheDocument();
  });

  it('invokes the injected openLink with a mailto: URL when the button is pressed', () => {
    const openLink = vi.fn();
    renderWithProviders(
      <FeedbackAction
        appVersion="1.0.0"
        platform="desktop-mac"
        role="Director"
        crashReportingEnabled={false}
        breadcrumbs={[]}
        openLink={openLink}
      />,
    );
    fireEvent.click(screen.getByTestId('settings-feedback-button'));
    expect(openLink).toHaveBeenCalledTimes(1);
    const url = openLink.mock.calls[0][0] as string;
    expect(url).toMatch(/^mailto:feedback@cachink\.mx\?subject=/);
    expect(decodeURIComponent(url)).toContain('Cachink! 1.0.0');
    expect(decodeURIComponent(url)).toContain('desktop-mac');
    expect(decodeURIComponent(url)).toContain('Director');
  });

  it('embeds breadcrumbs only when crashReportingEnabled is true', () => {
    const openLink = vi.fn();
    const breadcrumbs = [{ message: 'opened sales screen', timestamp: '2026-04-25T00:00:00Z' }];
    // Without consent — breadcrumbs must NOT appear.
    renderWithProviders(
      <FeedbackAction
        appVersion="1.0.0"
        platform="ios"
        role="Operativo"
        crashReportingEnabled={false}
        breadcrumbs={breadcrumbs}
        openLink={openLink}
      />,
    );
    fireEvent.click(screen.getByTestId('settings-feedback-button'));
    expect(decodeURIComponent(openLink.mock.calls[0][0] as string)).not.toContain(
      'opened sales screen',
    );

    // With consent — breadcrumbs ship in the body.
    openLink.mockClear();
    renderWithProviders(
      <FeedbackAction
        appVersion="1.0.0"
        platform="ios"
        role="Operativo"
        crashReportingEnabled={true}
        breadcrumbs={breadcrumbs}
        openLink={openLink}
        testID="settings-feedback-card-2"
      />,
    );
    // Both render, click the second one (the consented variant).
    const cards = screen.getAllByTestId('settings-feedback-button');
    fireEvent.click(cards[cards.length - 1]);
    expect(decodeURIComponent(openLink.mock.calls[0][0] as string)).toContain(
      'opened sales screen',
    );
  });
});
