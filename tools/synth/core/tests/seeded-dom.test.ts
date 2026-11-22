import assert from 'node:assert/strict';

import { chromium, type Browser, type Page } from 'playwright-core';
import { afterAll, beforeAll, describe, it } from 'vitest';

import { pageScript, type PageMutation } from '../src/seeded/page-script';

/**
 * The page half of the seeded bugs (S-12), on small pages shaped like the
 * register's own markup: a script that runs before the app's, keeps acting on
 * what React renders later, and touches nothing else. `seeded.integration`
 * checks each one on the real app.
 */
let browser: Browser;
beforeAll(async () => {
  browser = await chromium.launch({ headless: true });
});
afterAll(async () => browser.close());

const TICKET = `
  <button id="cobrar">Cobrar<span>$25.00 · efectivo</span></button>
  <button id="otro">Agregar</button>
  <div><span>Total</span><span id="total">$1,025.00</span></div>
  <p id="err">No se pudo cancelar: No tienes permiso para cancelar ventas</p>
  <script>window.n = 0; document.getElementById('cobrar').onclick = () => window.n++;</script>`;

/** Served as a real navigation, as the app is: init scripts run on a new document, not `setContent`. */
async function open(m: PageMutation, html = TICKET, width = 1280): Promise<Page> {
  const page = await browser.newPage({ viewport: { width, height: 800 } });
  await page.addInitScript({ content: pageScript(m) });
  await page.route('http://caja.test/', (r) =>
    r.fulfill({ contentType: 'text/html', body: `<!doctype html><body>${html}</body>` }),
  );
  await page.goto('http://caja.test/');
  return page;
}

describe('pageScript', () => {
  it('first-click: the button ignores its first click only, others are untouched', async () => {
    const page = await open({ kind: 'first-click', button: 'Cobrar' });
    await page.click('#cobrar');
    assert.equal(await page.evaluate(() => (window as unknown as { n: number }).n), 0);
    await page.click('#cobrar');
    assert.equal(await page.evaluate(() => (window as unknown as { n: number }).n), 1);
    await page.close();
  });

  it('relabel: the button’s own words change, its amount stays, later buttons too', async () => {
    const page = await open({ kind: 'relabel', from: 'Cobrar', to: 'Procesar transacción (POS)' });
    assert.match(
      (await page.textContent('#cobrar')) ?? '',
      /^Procesar transacción \(POS\)\$25\.00/,
    );
    await page.evaluate(() => {
      const b = document.createElement('button');
      b.id = 'nuevo';
      b.textContent = 'Cobrar';
      document.body.append(b);
    });
    await page.waitForFunction(() => document.getElementById('nuevo')?.textContent !== 'Cobrar');
    await page.close();
  });

  it('total-off: the amount after «Total» is a centavo short, and stays so after React rewrites it', async () => {
    const page = await open({ kind: 'total-off', centavos: -1 });
    assert.equal(await page.textContent('#total'), '$1,024.99');
    await page.evaluate(() => {
      const t = document.getElementById('total');
      if (t) t.textContent = '$50.00';
    });
    await page.waitForFunction(() => document.getElementById('total')?.textContent === '$49.99');
    await page.close();
  });

  it('translate: the Spanish sentence becomes the English one, the rest of the line stays', async () => {
    const page = await open({
      kind: 'translate',
      from: 'No tienes permiso para cancelar ventas',
      to: 'Permission denied (SIN_PERMISO)',
    });
    assert.equal(
      await page.textContent('#err'),
      'No se pudo cancelar: Permission denied (SIN_PERMISO)',
    );
    await page.close();
  });

  it('off-screen: the button leaves the viewport at 360 px and stays put at 800', async () => {
    const m: PageMutation = { kind: 'off-screen', button: 'Cobrar', maxWidth: 360 };
    const narrow = await open(m, TICKET, 360);
    const box = await narrow.locator('#cobrar').boundingBox();
    assert.ok(box !== null && box.x >= 360, `x ${box?.x}`);
    const wide = await open(m, TICKET, 800);
    const box2 = await wide.locator('#cobrar').boundingBox();
    assert.ok(box2 !== null && box2.x < 800, `x ${box2?.x}`);
    await narrow.close();
    await wide.close();
  });
});
