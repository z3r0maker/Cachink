import { expect, test } from '@playwright/test';

/**
 * P-24: the owner can fold the sidebar to its 84 px icon rail at any width,
 * the choice survives a reload, and navigating does not undo it. Below
 * 1024 px the rail is forced and the toggle is absent.
 */
test('the sidebar folds to the rail, stays folded, and unfolds', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'tablet', 'below 1024 px the rail is forced');
  await page.goto('/');
  const aside = page.locator('aside').first();
  await page.getByRole('button', { name: 'Contraer menú' }).click();
  await expect.poll(async () => (await aside.boundingBox())?.width).toBe(84);

  await page.reload();
  await expect.poll(async () => (await aside.boundingBox())?.width).toBe(84);
  await aside.getByRole('link', { name: 'Productos' }).click();
  await expect(page).toHaveURL(/\/productos$/);
  await expect.poll(async () => (await aside.boundingBox())?.width).toBe(84);

  await page.getByRole('button', { name: 'Expandir menú' }).click();
  await expect.poll(async () => (await aside.boundingBox())?.width).toBe(248);
});
