const { test, expect } = require('@playwright/test');

test('Guest user completes checkout with Cash on Delivery', async ({ page }) => {

  // Open storefront
  await page.goto('https://demo.shopware.com');

  // Assertion: Homepage loads
  await expect(page).toHaveURL(/.*shopware.*/);

  // Search for product
  await page.getByPlaceholder('Search...').fill('Aerodynamic');
  await page.keyboard.press('Enter');

  // Assertion: Search results visible
  await expect(page.locator('body')).toContainText('Aerodynamic');

  // Open first product
  await page.locator('.product-name').first().click();

  // Assertion: Product detail page opens
  await expect(page.locator('h1')).toBeVisible();

  // Add product to cart
  await page.getByRole('button', { name: /add to shopping cart/i }).click();

  // Open cart
  await page.getByRole('link', { name: /shopping cart/i }).click();

  // Assertion: Product exists in cart
  await expect(page.locator('.cart-item')).toBeVisible();

  // Proceed to checkout
  await page.getByRole('link', { name: /checkout/i }).click();

  // Guest checkout
  await page.getByLabel(/first name/i).fill('John');
  await page.getByLabel(/last name/i).fill('Doe');
  await page.getByLabel(/email/i).fill(`john${Date.now()}@test.com`);

  await page.getByLabel(/street address/i).fill('123 Test Street');
  await page.getByLabel(/zip code/i).fill('12345');
  await page.getByLabel(/city/i).fill('Berlin');

  // Select country
  await page.getByLabel(/country/i).selectOption('Germany');

  // Select Cash on Delivery
  await page.getByLabel(/cash on delivery/i).check();

  // Assertion: COD selected
  await expect(
    page.getByLabel(/cash on delivery/i)
  ).toBeChecked();

  // Confirm order
  await page.getByRole('button', { name: /submit order/i }).click();

  // Assertion: Order confirmation page
  await expect(page.locator('body')).toContainText(/thank you for your order/i);

  // Assertion: Order number displayed
  await expect(page.locator('body')).toContainText(/order number/i);
});