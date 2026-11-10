import { expect, test } from './test';
import { mintTenant, signIn, type Tenant } from './tenant';
import { addLogo } from './tenant-rows';

/**
 * An uploaded logo cannot run script on the portal's origin (audit F-01), on
 * a tenant of its own so it writes freely in every viewport.
 *
 * Two layers, each asserted where it acts. The upload gate refuses an SVG the
 * old filter stored (`<x:script>` under a prefix bound to the SVG namespace)
 * and says so. The public logo route answers the bytes it does hold under a
 * sandbox policy, so the response is safe whatever the gate let through: that
 * is read off the wire, because `next.config.mjs` and the route handler both
 * have a say in the header and only the wire shows who won.
 *
 * The same reading for a page (audit F-04): one enforced policy, no
 * report-only twin, framing refused.
 */
test.use({ storageState: { cookies: [], origins: [] } });

const SANDBOX = "default-src 'none'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'none'";

const HONEST =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
  '<title>Fonda</title><path fill="#1d7a46" d="M4 4h16v16H4z"/></svg>';

const HOSTILE =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:x="http://www.w3.org/2000/svg">' +
  '<x:script>document.title="pwned"</x:script><path fill="#1d7a46" d="M4 4h16v16H4z"/></svg>';

/** Where the stored SVG's payloads would call home if any of them ran. */
const BEACON = '/api/logo-beacon';
const STORED_HOSTILE =
  `<svg xmlns="http://www.w3.org/2000/svg" onload="fetch('${BEACON}/onload')">` +
  `<script>fetch('${BEACON}/script')</script><image href="${BEACON}/image.png" width="9" height="9"/></svg>`;

const svg = (name: string, source: string) => ({
  name,
  mimeType: 'image/svg+xml',
  buffer: Buffer.from(source, 'utf8'),
});

let t: Tenant;

test.beforeAll(async () => {
  t = await mintTenant({ label: 'Logo' });
});

test('the logo route answers an uploaded SVG sandboxed, and the gate refuses a hostile one', async ({
  page,
}) => {
  await signIn(page, t);
  await page.goto('/negocio/comprobantes');

  await page.setInputFiles('input[type="file"]', svg('logo.svg', HONEST));
  await expect(page.getByText('Logo guardado.')).toBeVisible();

  const logo = await page.request.get(`/api/logos/${t.biz}`);
  expect(logo.status()).toBe(200);
  expect(logo.headers()['content-type']).toBe('image/svg+xml');
  expect(logo.headers()['content-security-policy']).toBe(SANDBOX);
  expect(logo.headers()['x-content-type-options']).toBe('nosniff');
  // The bytes that reached the page are the ones this tenant uploaded.
  expect(await logo.text()).toBe(HONEST);

  await page.setInputFiles('input[type="file"]', svg('malo.svg', HOSTILE));
  await expect(page.getByText('Ese SVG trae elementos que no permitimos.')).toBeVisible();
  const still = await page.request.get(`/api/logos/${t.biz}`);
  expect(await still.text()).toBe(HONEST);
});

test('a hostile SVG that is already stored runs nothing when opened as a document', async ({
  page,
}) => {
  // Written past the gate, as if the gate had been wrong: the route must hold alone.
  const otro = await mintTenant({ label: 'Logo hostil' });
  await addLogo(otro, STORED_HOSTILE);

  // What the server answered, and what the browser refused to send. A request
  // the policy blocks is still announced by the browser, so «asked» proves
  // nothing: only an answer means something left the page.
  const answered: string[] = [];
  const blocked: string[] = [];
  const beacon = (url: string) => new URL(url).pathname.startsWith(BEACON);
  page.on('response', (r) => beacon(r.url()) && answered.push(new URL(r.url()).pathname));
  page.on(
    'requestfailed',
    (r) =>
      beacon(r.url()) && blocked.push(`${new URL(r.url()).pathname} ${r.failure()?.errorText}`),
  );
  const response = await page.goto(`/api/logos/${otro.biz}`);
  expect(response?.status()).toBe(200);
  expect(response?.headers()['content-security-policy']).toBe(SANDBOX);
  expect(await response?.text()).toBe(STORED_HOSTILE);
  await page.waitForLoadState('networkidle');
  // Its script, its handler and its image would each have reached this path.
  expect(answered).toEqual([]);
  // The script and the handler never ran, so they asked for nothing; the image
  // was asked for and the policy refused it before it left.
  expect(blocked).toEqual([`${BEACON}/image.png csp`]);
});

test('a page carries one enforced policy, and no report-only twin', async ({ page }) => {
  const response = await page.goto('/login');
  const headers = response?.headers() ?? {};
  const csp = headers['content-security-policy'] ?? '';
  expect(headers['content-security-policy-report-only']).toBeUndefined();
  // One policy, not two joined by the server: a second would repeat the directive.
  expect(csp.match(/frame-ancestors/g)).toHaveLength(1);
  expect(csp).toMatch(/script-src 'self' 'nonce-[A-Za-z0-9+/=]+' 'strict-dynamic'/);
  expect(csp).toContain("frame-ancestors 'none'");
  expect(csp).toContain('report-uri /api/csp-report');
  // And the page still runs under it: the door is interactive.
  await page.getByTestId('login-door-owner').click();
  await expect(page.getByTestId('login-email')).toBeVisible();
});
