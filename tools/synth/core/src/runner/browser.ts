import { chromium, type BrowserContext, type Page } from 'playwright-core';

import type { Persona } from '../schemas/persona';
import { networkConditions } from './network';

/**
 * The run's Chromium (ADR-153 §5: the runner owns the browser). A fresh
 * profile, the persona's viewport, touch and network, service workers blocked
 * as the e2e suite blocks them, and a CDP port Playwright MCP attaches to, so
 * the actor drives the very page the runner captures.
 */
export interface RunBrowser {
  readonly context: BrowserContext;
  readonly page: Page;
  /** Where Playwright MCP connects (`--cdp-endpoint`). */
  readonly cdpUrl: string;
  close(): Promise<void>;
}

export async function launchBrowser(o: {
  readonly persona: Persona;
  readonly profileDir: string;
  readonly cdpPort: number;
  /** The stack's portal: relative URLs (`/login`, the scenario's start) resolve against it. */
  readonly baseUrl: string;
  /** Sent as `x-forwarded-for`: the portal's throttles key on it (owner decision 3). */
  readonly address: string;
}): Promise<RunBrowser> {
  const [width, height] = o.persona.device.viewport;
  const touch = o.persona.device.input === 'touch';
  const context = await chromium.launchPersistentContext(o.profileDir, {
    baseURL: o.baseUrl,
    headless: true,
    viewport: { width, height },
    hasTouch: touch,
    isMobile: touch,
    serviceWorkers: 'block',
    extraHTTPHeaders: { 'x-forwarded-for': o.address },
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    args: [`--remote-debugging-port=${o.cdpPort}`, '--remote-debugging-address=127.0.0.1'],
  });
  const page = context.pages()[0] ?? (await context.newPage());
  const conditions = networkConditions(o.persona.device.network);
  if (conditions !== null) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', conditions);
  }
  return {
    context,
    page,
    cdpUrl: `http://127.0.0.1:${o.cdpPort}`,
    close: () => context.close(),
  };
}
