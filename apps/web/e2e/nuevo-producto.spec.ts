import { expect, test } from './test';

import { filled } from './interact';

/**
 * «Nuevo producto» as its own page (ADR-107): three questions, an icon read
 * from the name, the margin in words, and no step skipped with a blank answer.
 * Nothing is saved here — creating is `movimientos.sync.spec.ts`'s, where the
 * phones can check it arrived — so this runs in every viewport.
 */
test('the catalogue opens the page, and Cancelar goes back', async ({ page }) => {
  await page.goto('/productos');
  await page.getByRole('link', { name: 'Nuevo producto' }).click();
  await expect(page).toHaveURL(/\/productos\/nuevo$/);
  await expect(page.getByRole('heading', { name: 'Nuevo producto', level: 1 })).toBeVisible();
  await page.getByRole('link', { name: 'Cancelar' }).click();
  await expect(page).toHaveURL(/\/productos$/);
});

test('the name picks the icon, and a picked one sticks', async ({ page }) => {
  await page.goto('/productos/nuevo');
  const iconos = page.getByRole('radiogroup', { name: 'Icono' });
  await filled(page.getByTestId('producto-nombre'), 'Café de olla');
  await expect(iconos.getByRole('radio', { name: 'Café' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Por el nombre, le puse este.')).toBeVisible();

  await iconos.getByRole('radio', { name: 'Pan' }).click();
  await expect(page.getByText('Tú lo escogiste.')).toBeVisible();
  // The preview tile follows the draft.
  await expect(page.getByTestId('producto-preview')).toContainText('Café de olla');

  // No category tabs: every icon is one tap on «Ver los N íconos».
  await expect(page.getByRole('tab')).toHaveCount(0);
  await page.getByRole('button', { name: /^Ver los \d+ íconos$/ }).click();
  await expect(iconos.getByRole('radio')).not.toHaveCount(10);
});

test('each step asks for its own answer before moving on', async ({ page }) => {
  await page.goto('/productos/nuevo');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByTestId('producto-error')).toHaveText('Escribe el nombre del producto.');

  await filled(page.getByTestId('producto-nombre'), 'Taco de suadero');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByTestId('producto-margen')).toHaveText(
    'Escribe el costo y el precio y te digo cuánto ganas.',
  );
  await page.getByTestId('producto-costo').fill('30');
  await page.getByTestId('producto-precio').fill('25');
  await expect(page.getByTestId('producto-margen')).toHaveText(
    'Ojo: lo vendes $5.00 abajo de lo que te cuesta',
  );
  await page.getByTestId('producto-precio').fill('');
  await page.getByRole('button', { name: 'Siguiente' }).click();
  await expect(page.getByTestId('producto-error')).toHaveText(
    'Escribe el precio de venta, por ejemplo 25.00',
  );

  // Back keeps the answers.
  await page.getByRole('button', { name: 'Atrás' }).click();
  await expect(page.getByTestId('producto-nombre')).toHaveValue('Taco de suadero');
});
