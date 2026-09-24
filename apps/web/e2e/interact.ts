import { expect, type Locator } from './test';

/**
 * Click something and prove it landed — clicking again if it did not.
 *
 * The portal is server-rendered and hydrates after the HTML arrives. A click
 * inside that window is *dropped*: the control is there, visible, enabled and
 * even takes focus, and nothing is listening yet. Playwright's auto-waiting
 * cannot see the difference, so a spec that navigates and clicks straight away
 * is racing the hydration — which is what took four unrelated specs down in one
 * full run: a venta row that never opened its drawer, «Ver detalle» with the
 * button focused and no dialog, «Configurar» with the other tab still pressed,
 * an «Editar» whose editor never came.
 *
 * So the *interaction* is what retries, not the assertion. It is what a person
 * does when a page swallows the first tap.
 *
 * Only for controls that reveal something — a drawer, a dialog, a panel, a tab.
 * Never for a toggle: a second click there would undo the first.
 */
export async function clickUntil(target: Locator, appears: Locator): Promise<void> {
  await expect(async () => {
    await target.click();
    await expect(appears).toBeVisible({ timeout: 2_000 });
  }).toPass({ timeout: 20_000, intervals: [250, 500, 1_000, 2_000] });
}

/**
 * Fill a whole form and prove every field survived — re-typing it if not.
 *
 * One field at a time is not enough, and the way it fails is instructive: a
 * `fill` that beats the component's hydration writes the DOM and not the state
 * behind it, and React does not re-render (nothing in its state changed), so the
 * typed text sits there and reads back correctly. The *next* field's fill is
 * what reaches React, and that re-render writes the empty state back over the
 * first field. `/saldos-iniciales` failed exactly that way: caja and bancos
 * stuck, the fecha above them went blank, and the save came back «Revisa estos
 * datos: fechaApertura».
 *
 * So the form is filled and then read back as a whole, after the re-renders its
 * own later fields caused.
 */
export async function filledAll(fields: readonly (readonly [Locator, string])[]): Promise<void> {
  await expect(async () => {
    for (const [field, value] of fields) await field.fill(value);
    for (const [field, value] of fields) await expect(field).toHaveValue(value, { timeout: 1_000 });
  }).toPass({ timeout: 20_000, intervals: [250, 500, 1_000] });
}

/**
 * Type into a controlled field and prove the typing survived.
 *
 * The same hydration window, one step worse: the portal's forms are React
 * state, so a `fill` that beats hydration writes the DOM and not the state
 * behind it — and when React does hydrate it renders its own empty state over
 * what was typed. The field goes blank *after* the fill returned, so checking
 * the value immediately proves nothing; the submit then posts nothing and the
 * screen answers «Escribe un asunto…» about a field the test filled.
 *
 * So: fill, wait a beat, and require the value to still be there.
 */
export async function filled(field: Locator, value: string): Promise<void> {
  await expect(async () => {
    await field.fill(value);
    await field.page().waitForTimeout(400);
    await expect(field).toHaveValue(value, { timeout: 1_000 });
  }).toPass({ timeout: 20_000, intervals: [250, 500, 1_000] });
}
