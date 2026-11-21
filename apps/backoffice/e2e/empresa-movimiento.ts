import { expect, type Locator, type Page } from '@playwright/test';

/**
 * E-46's checks for empresa.spec.ts (ADR-161). A rolling figure's digits are
 * `aria-hidden` generated content, so a spec reads the figure from the
 * odometer's visually hidden copy, the same text screen readers get; and
 * these helpers prove the digits on screen spell that same figure.
 */

/** The figure inside `l`, as its odometer's hidden copy carries it. */
export const cifra = (l: Locator): Locator => l.locator('[data-cifra]');

/**
 * The seven screens round 23 animates, at a period the earlier tests filled,
 * with how many rolling figures each shows at least (Resultados and Cierre
 * roll none: their values are chart labels and steps, which stay still).
 */
export const PANTALLAS = [
  { ruta: '/empresa?periodo=2024-03', cifras: 4 },
  { ruta: '/empresa/resultados?periodo=2024-03', cifras: 0 },
  { ruta: '/empresa/cierre', cifras: 0 },
  { ruta: '/empresa/caja', cifras: 4 },
  { ruta: '/empresa/tablero', cifras: 6 },
  { ruta: '/empresa/socios', cifras: 4 },
  { ruta: '/empresa/presupuesto', cifras: 0 },
] as const;

/** Every figure as its hidden copy says it, beside what its digits show. */
function leerCifras(): { readonly copia: string; readonly digitos: string }[] {
  return [...document.querySelectorAll<HTMLElement>('[data-cifra]')].flatMap((copia) => {
    // A figure without digits is plain text: nothing of it rolls.
    const odometro = copia.previousElementSibling;
    if (odometro?.getAttribute('aria-hidden') !== 'true') return [];
    const digitos = [...odometro.children].map((lugar) => {
      const tira = lugar.firstElementChild;
      if (tira === null) return (lugar as HTMLElement).dataset.c ?? '';
      const y = new DOMMatrixReadOnly(getComputedStyle(tira).transform).m42;
      const alto = lugar.getBoundingClientRect().height;
      return String(Math.round(-y / alto) - 10);
    });
    return [{ copia: copia.textContent ?? '', digitos: digitos.join('') }];
  });
}

/** Each odometer's digits stop on the figure its hidden copy carries; at least `minimo` of them. */
export async function cifrasEnteras(page: Page, minimo: number): Promise<void> {
  const cifras = await page.evaluate(leerCifras);
  expect(cifras.length).toBeGreaterThanOrEqual(minimo);
  for (const c of cifras) {
    expect(c.copia).toMatch(/\d/);
    expect(c.digitos).toBe(c.copia);
  }
}

/** With reduced motion, nothing on the page animates at all. */
export async function nadaSeMueve(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
}

/**
 * With motion, every animation ends within 1.5 s of the screen opening, and
 * «Vivo»'s three pulses within WCAG 2.2.2's five seconds; then they settle.
 */
export async function seAsienta(page: Page): Promise<void> {
  const finales = await page.evaluate(() =>
    document.getAnimations().map((a) => {
      const t = a.effect?.getComputedTiming();
      return { fin: Number(t?.endTime ?? 0), veces: Number(t?.iterations ?? 1) };
    }),
  );
  expect(finales.length).toBeGreaterThan(0);
  for (const f of finales) expect(f.fin).toBeLessThanOrEqual(f.veces === 3 ? 5000 : 1500);
  await expect
    .poll(() =>
      page.evaluate(() => document.getAnimations().every((a) => a.playState === 'finished')),
    )
    .toBe(true);
}

/** Whether `l` is animating now or holds a finished animation: «Sello» landed on it. */
export const animado = (l: Locator): Promise<boolean> =>
  l.evaluate((el) => el.getAnimations().length > 0);
