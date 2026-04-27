/**
 * FeedbackAction mailto builder tests (P1F-M3 C9).
 *
 * Verifies the PII scrubbing contract: email + phone patterns never
 * reach the mailto URL, and breadcrumbs only embed when consent was
 * explicitly granted (ADR-027).
 */

import { describe, expect, it } from 'vitest';
import { buildFeedbackMailto } from '../../src/screens/Settings/feedback-action';

describe('buildFeedbackMailto', () => {
  it('composes a mailto to feedback@cachink.mx', () => {
    const url = buildFeedbackMailto({
      appVersion: '0.1.0',
      platform: 'ios',
      role: 'Director',
      consent: false,
      breadcrumbs: [],
    });
    expect(url.startsWith('mailto:feedback@cachink.mx')).toBe(true);
    expect(url).toMatch(/subject=/);
    expect(url).toMatch(/Cachink!%20/);
  });

  it('omits breadcrumbs entirely when consent is false', () => {
    const url = buildFeedbackMailto({
      appVersion: '0.1.0',
      platform: 'android',
      role: 'Operativo',
      consent: false,
      breadcrumbs: [{ message: 'Tap venta', timestamp: '2026-04-23T10:00:00Z' }],
    });
    expect(decodeURIComponent(url)).not.toContain('Tap venta');
  });

  it('includes breadcrumbs when consent is true, up to 10', () => {
    const url = buildFeedbackMailto({
      appVersion: '0.1.0',
      platform: 'ios',
      role: 'Director',
      consent: true,
      breadcrumbs: Array.from({ length: 15 }, (_, i) => ({
        message: `event-${i}`,
        timestamp: '2026-04-23T10:00:00Z',
      })),
    });
    const body = decodeURIComponent(url);
    // Should include the last 10 breadcrumbs (event-5 through event-14).
    expect(body).toContain('event-14');
    expect(body).toContain('event-5');
    expect(body).not.toContain('event-4');
  });

  it('scrubs email addresses from breadcrumb messages', () => {
    const url = buildFeedbackMailto({
      appVersion: '0.1.0',
      platform: 'ios',
      role: 'Director',
      consent: true,
      breadcrumbs: [{ message: 'Contacto cliente@ejemplo.com', timestamp: 'ts' }],
    });
    const body = decodeURIComponent(url);
    expect(body).toContain('[email]');
    expect(body).not.toContain('cliente@ejemplo.com');
  });

  it('scrubs phone numbers from breadcrumb messages', () => {
    const url = buildFeedbackMailto({
      appVersion: '0.1.0',
      platform: 'ios',
      role: 'Director',
      consent: true,
      breadcrumbs: [{ message: 'Llamar +52 33 1234 5678', timestamp: 'ts' }],
    });
    const body = decodeURIComponent(url);
    expect(body).toContain('[phone]');
    expect(body).not.toContain('1234 5678');
  });
});
