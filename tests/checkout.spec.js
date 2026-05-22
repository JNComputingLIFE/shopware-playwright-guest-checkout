import { test, expect } from '@playwright/test';

/**
 * Helper: open product via search
 */
async function searchProduct(page, keyword) {
  const search = page.getByRole('combobox', { name: /suchbegriff eingeben/i });
  await search.fill(keyword);
  await search.press('Enter');
}

/**
 * Helper: open first product result
 */
async function openFirstProduct(page) {
  await page.getByRole('link').filter({ hasText: /€|product|variant/i }).first().click();
}

/**
 * Helper: add to cart
 */
async function addToCart(page) {
  await page.getByRole('button', { name: /in den warenkorb|add to cart/i }).click();
}

/**
 * Helper: go to checkout
 */
async function goToCheckout(page) {
  await page.getByRole('link', { name: /zur kasse|checkout/i }).click();
}

/**
 * Helper: fill guest checkout
 */
async function fillCheckout(page, email = `test${Date.now()}@mail.com`) {
  await page.getByRole('textbox', { name: /vorname/i }).fill('John');
  await page.getByRole('textbox', { name: /nachname/i }).fill('Doe');
  await page.getByRole('textbox', { name: /e-?mail/i }).fill(email);
  await page.getByRole('textbox', { name: /straße/i }).fill('Test Street 1');
  await page.getByRole('textbox', { name: /plz/i }).fill('12345');
  await page.getByRole('textbox', { name: /ort/i }).fill('Berlin');
}

/* =========================================================
   POSITIVE TEST CASES
========================================================= */

// POS-001
test('POS-001 Guest checkout success', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await fillCheckout(page);

  await page.getByText(/cash on delivery/i).click();
  await page.getByRole('checkbox', { name: /agb/i }).check();

  await page.getByRole('button', { name: /zahlungspflichtig bestellen/i }).click();

  await expect(page.locator('body')).toContainText(/order number|thank you/i);
});

// POS-002
test('POS-002 Add multiple quantities', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);

  const qty = page.locator('input[type="number"], input[name*="quantity"]').first();
  await qty.fill('2');

  await addToCart(page);

  await page.getByRole('link', { name: /cart|warenkorb/i }).click();

  await expect(page.locator('body')).toContainText('2');
});

// POS-003
test('POS-003 Search product', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');

  await expect(page).toHaveURL(/search|listing/);
  await expect(page.locator('body')).toContainText(/product|€/i);
});

// POS-004
test('POS-004 Remove product from cart', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);

  await page.getByRole('link', { name: /cart/i }).click();

  await page.getByRole('button', { name: /remove|delete|entfernen/i }).first().click();

  await expect(page.locator('body')).not.toContainText(/Aerodynamic/i);
});

// POS-005
test('POS-005 Change shipping address', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await fillCheckout(page);

  // alternate shipping (if UI exists)
  const alt = page.getByRole('textbox', { name: /shipping|lieferadresse/i });
  if (await alt.count() > 0) {
    await alt.first().fill('Alt Address 99');
  }

  await expect(page.getByRole('textbox', { name: /vorname/i })).toBeVisible();
});

// POS-006
test('POS-006 COD visible', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await expect(page.getByText(/cash on delivery/i)).toBeVisible();
});

// POS-007
test('POS-007 Cart persistence', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);

  await page.goto('/');
  await page.getByRole('link', { name: /cart|warenkorb/i }).click();

  await expect(page.locator('body')).toContainText(/Aerodynamic|1 item/i);
});

/* =========================================================
   NEGATIVE TEST CASES
========================================================= */

test('NEG-001 Empty cart checkout blocked', async ({ page }) => {
  await page.goto('/cart');

  const checkout = page.getByRole('link', { name: /checkout/i });

  await expect(checkout).toBeDisabled().catch(async () => {
    await checkout.click({ force: true });
    await expect(page.locator('body')).toContainText(/empty|error/i);
  });
});

test('NEG-002 Missing required fields', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await page.getByRole('button', { name: /zahlungspflichtig bestellen/i }).click();

  await expect(page.locator('body')).toContainText(/required|error|pflicht/i);
});

test('NEG-003 Invalid email format', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await page.getByRole('textbox', { name: /e-?mail/i }).fill('test@');

  await page.getByRole('button', { name: /zahlungspflichtig bestellen/i }).click();

  await expect(page.locator('body')).toContainText(/email|invalid/i);
});

/* =========================================================
   EDGE CASES
========================================================= */

test('EDGE-001 Long name input', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await page.getByRole('textbox', { name: /vorname/i }).fill('a'.repeat(260));

  await expect(page.getByRole('textbox', { name: /vorname/i })).toBeVisible();
});

test('EDGE-002 Special characters in address', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await page.getByRole('textbox', { name: /straße/i }).fill('äé#&/ Test Straße');

  await expect(page.locator('body')).not.toContainText(/error/i);
});

test('EDGE-003 Quantity 0 handling', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);

  const qty = page.locator('input[type="number"]').first();
  await qty.fill('0');

  await expect(page.locator('body')).toContainText(/0|remove|invalid/i);
});

test('EDGE-004 Large quantity handling', async ({ page }) => {
  await page.goto('/');

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);

  const qty = page.locator('input[type="number"]').first();
  await qty.fill('9999');

  await addToCart(page);

  await expect(page.locator('body')).toContainText(/limit|stock|error/i);
});