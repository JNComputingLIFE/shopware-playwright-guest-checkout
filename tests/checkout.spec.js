const { test, expect } = require('@playwright/test');

test('Guest user completes checkout with Cash on Delivery', async ({ page, baseURL }) => {

  // 1. Open storefront using the baseURL from configuration
  await page.goto('/');

  // Assertion: Page loads and URL contains the expected domain
  await expect(page).toHaveURL(new RegExp(baseURL));

  // 2. Search for product (Shopware 6 search input usually placeholder 'Search...')
  const searchInput = page.getByPlaceholder(/search.../i);
  await searchInput.waitFor({ state: 'visible' });
  await searchInput.fill('Aerodynamic');
  await page.keyboard.press('Enter');

  // Assertion: Search results page loaded
  await expect(page).toHaveURL(/.*search.*/);

  // 3. Open first product 
  // Shopware 6 native templates use card titles or product-image links. 
  // We look for a link containing our text or fallback to the product name wrapper.
  const firstProduct = page.locator('.product-name, .product-box, .product-title').first();
  await firstProduct.scrollIntoViewIfNeeded();
  await firstProduct.click();

  // Assertion: Product detail page opens (H1 title exists)
  await expect(page.locator('h1')).toBeVisible();

  // 4. Add product to cart
  await page.getByRole('button', { name: /add to shopping cart|buy/i }).click();

  // 5. Open cart (Shopware 6 often opens an off-canvas cart first)
  // Let's target the cart link safely
  const cartButton = page.getByRole('link', { name: /shopping cart|checkout/i }).first();
  await cartButton.click();

  // 6. Proceed to checkout from Cart
  await page.getByRole('link', { name: /proceed to checkout|checkout/i }).click();

  // 7. Fill Guest checkout form
  // Shopware 6 checkout requires choosing "Do not create a customer account" for guest checkout
  const guestCheckbox = page.getByLabel(/do not create a customer account/i);
  if (await guestCheckbox.isVisible()) {
    await guestCheckbox.check();
  }

  await page.getByLabel(/first name/i).fill('John');
  await page.getByLabel(/last name/i).fill('Doe');
  await page.getByLabel(/email/i).fill(`john${Date.now()}@test.com`);
  await page.getByLabel(/street address/i).fill('123 Test Street');
  await page.getByLabel(/zip code|postal code/i).fill('12345');
  await page.getByLabel(/city/i).fill('Berlin');

  // Select country (Ensure 'Germany' or equivalent is selected)
  await page.getByLabel(/country/i).selectOption({ label: 'Germany' });

  // 8. Select Cash on Delivery
  // Payment methods in Shopware 6 are often custom radio buttons/labels
  const codRadio = page.getByLabel(/cash on delivery/i);
  await codRadio.scrollIntoViewIfNeeded();
  await codRadio.check();

  // Assertion: COD selected
  await expect(codRadio).toBeChecked();

  // 9. Submit Order
  // Shopware 6 requires accepting Terms & Conditions (TOS) before order placement
  const tosCheckbox = page.getByLabel(/i have read and accept the terms/i);
  if (await tosCheckbox.isVisible()) {
    await tosCheckbox.check();
  }

  await page.getByRole('button', { name: /submit order|place order/i }).click();

  // 10. Assertions: Order confirmation page
  await expect(page.locator('body')).toContainText(/thank you for your order/i);
  await expect(page.locator('body')).toContainText(/order number/i);
});