const { test, expect } = require('@playwright/test');

/* =========================================================
   REUSABLE FUNCTIONS (With Meaningful Assertions)
========================================================= */

async function searchProduct(page, keyword) {
  const searchInput = page.getByRole('combobox', { name: /search|suchbegriff/i });
  await expect(searchInput).toBeVisible(); // Assertion
  await searchInput.fill(keyword);
  await searchInput.press('Enter');
  
  // Assertion: verify search took place
  await expect(page).toHaveURL(/search|suggest/i);
}

async function openFirstProduct(page) {
  const firstProduct = page.getByRole('link').filter({ hasText: /€|\$|product|variant/i }).first();
  await expect(firstProduct).toBeVisible(); // Assertion
  await firstProduct.click();
  
  // Assertion: Verify we landed on a product details page
  await expect(page.locator('.product-detail-name, h1').first()).toBeVisible();
}

async function addToCart(page) {
  const addBtn = page.getByRole('button', { name: /in den warenkorb|add to cart/i });
  await expect(addBtn).toBeEnabled(); // Assertion
  await addBtn.click();
  
  // Assertion: verify cart flyout/notification appears
  await expect(page.locator('.offcanvas-cart, .alert-success').first()).toBeVisible();
}

async function goToCheckout(page) {
  const checkoutBtn = page.getByRole('link', { name: /zur kasse|checkout/i });
  await expect(checkoutBtn).toBeVisible(); // Assertion
  await checkoutBtn.click();
  
  // Assertion: verify we are on the checkout/register page
  await expect(page).toHaveURL(/checkout|register/i);
}

async function fillCheckout(page, email = `test${Date.now()}@mail.com`) {
  await page.getByRole('textbox', { name: /vorname|first name/i }).fill('John');
  await page.getByRole('textbox', { name: /nachname|last name/i }).fill('Doe');
  await page.getByRole('textbox', { name: /e-?mail/i }).fill(email);
  await page.getByRole('textbox', { name: /straße|street/i }).fill('Test Street 1');
  await page.getByRole('textbox', { name: /plz|zip/i }).fill('12345');
  await page.getByRole('textbox', { name: /ort|city/i }).fill('Berlin');
}

/* =========================================================
   POSITIVE TEST CASES
========================================================= */

test('POS-001 Guest checkout success', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('banner')).toBeVisible();

  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);
  await fillCheckout(page);

  // Continue to confirm order step if multistep
  const continueBtn = page.getByRole('button', { name: /weiter|continue/i });
  if (await continueBtn.isVisible()) await continueBtn.click();

  const codOption = page.getByText(/cash on delivery|nachnahme/i);
  await expect(codOption).toBeVisible();
  await codOption.click();

  const terms = page.getByRole('checkbox', { name: /agb|terms/i });
  await terms.check();
  await expect(terms).toBeChecked(); // Assertion

  await page.getByRole('button', { name: /zahlungspflichtig bestellen|place order/i }).click();

  // Meaningful Assertion: Final confirmation
  await expect(page).toHaveURL(/finish|success/i);
  await expect(page.locator('body')).toContainText(/order number|thank you|vielen dank/i);
});

test('POS-002 Add multiple quantities', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);

  const qty = page.locator('select[name="lineItems[0][quantity]"], input[name="quantity"]').first();
  await expect(qty).toBeVisible();
  await qty.fill('2'); // or .selectOption('2') if it's a dropdown

  await addToCart(page);
  await page.getByRole('link', { name: /cart|warenkorb/i }).click();

  // Assertion: ensure cart updated
  await expect(page.locator('.cart-item-quantity, .line-item-quantity').first()).toHaveValue('2');
});

test('POS-003 Search product', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  
  const results = page.locator('.product-box, .cms-listing-row');
  await expect(results.first()).toBeVisible();
  await expect(page.locator('body')).toContainText(/Aerodynamic/i);
});

test('POS-004 Remove product from cart', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);

  await page.getByRole('link', { name: /cart|warenkorb/i }).click();
  const removeBtn = page.getByRole('button', { name: /remove|delete|entfernen/i }).first();
  await expect(removeBtn).toBeVisible();
  await removeBtn.click();

  await expect(page.locator('body')).toContainText(/empty|leer/i);
});

test('POS-005 Change shipping address', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);
  await fillCheckout(page);

  const diffShippingCheckbox = page.getByRole('checkbox', { name: /different shipping|abweichende lieferadresse/i });
  if (await diffShippingCheckbox.isVisible()) {
    await diffShippingCheckbox.check();
    await page.getByRole('textbox', { name: /shipping street|lieferadresse straße/i }).fill('Alt Address 99');
    await expect(page.getByRole('textbox', { name: /shipping street/i })).toHaveValue('Alt Address 99');
  }
});

test('POS-006 COD visible', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);
  
  // Checking payment methods section
  const paymentSection = page.locator('.payment-methods, .checkout-main');
  await expect(paymentSection).toBeVisible();
  await expect(paymentSection).toContainText(/cash on delivery|nachnahme/i);
});

test('POS-007 Cart persistence', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);

  // Navigate away and back
  await page.goto('/');
  const cartLink = page.getByRole('link', { name: /cart|warenkorb/i });
  await cartLink.click();

  await expect(page.locator('.cart-item-details, .line-item-details')).toContainText(/Aerodynamic/i);
});

/* =========================================================
   NEGATIVE TEST CASES
========================================================= */

test('NEG-001 Empty cart checkout blocked', async ({ page }) => {
  await page.goto('/checkout/cart');
  const checkoutBtn = page.getByRole('link', { name: /checkout|zur kasse/i });
  
  // Either the button isn't there, is disabled, or clicking it shows an error
  if (await checkoutBtn.isVisible()) {
    await expect(checkoutBtn).toHaveClass(/disabled/);
  } else {
    await expect(page.locator('body')).toContainText(/empty|leer/i);
  }
});

test('NEG-002 Missing required fields', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  // Try to submit without filling form
  const submitBtn = page.getByRole('button', { name: /weiter|continue/i });
  await submitBtn.click();

  // Expect HTML5 validation or form errors
  await expect(page.locator('input:invalid').first()).toBeVisible();
});

test('NEG-003 Invalid email format', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  await page.getByRole('textbox', { name: /e-?mail/i }).fill('test@');
  const submitBtn = page.getByRole('button', { name: /weiter|continue/i });
  await submitBtn.click();

  // Expect HTML5 validation pseudo-class
  const emailInput = page.getByRole('textbox', { name: /e-?mail/i });
  await expect(emailInput).toHaveClass(/is-invalid|error/);
});

test('NEG-004 Add out-of-stock product to cart', async ({ page }) => {
  await page.goto('/');
  
  // Search for an item known to be unavailable
  await searchProduct(page, 'Out of Stock'); 
  await openFirstProduct(page);

  const addBtn = page.getByRole('button', { name: /in den warenkorb|add to cart/i });
  
  // Handle both common implementations: disabled button OR error toast on click
  const isDisabled = await addBtn.isDisabled();
  if (isDisabled) {
    await expect(addBtn).toBeDisabled();
  } else {
    await addBtn.click();
    await expect(page.locator('body')).toContainText(/out of stock|nicht lieferbar|sold out/i);
  }
});

test('NEG-005 Attempt order confirmation without selecting payment method', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);
  await fillCheckout(page);

  // If a payment method is auto-selected by default, you may need to deselect it here.
  // Otherwise, attempt to submit the order directly.
  await page.getByRole('button', { name: /zahlungspflichtig bestellen|place order/i }).click();

  await expect(page.locator('body')).toContainText(/payment method|zahlungsart|auswählen/i);
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

  const longName = 'a'.repeat(260);
  const nameInput = page.getByRole('textbox', { name: /vorname|first name/i });
  await nameInput.fill(longName);

  await expect(nameInput).toHaveValue(longName);
});

test('EDGE-002 Special characters in address', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);

  const streetInput = page.getByRole('textbox', { name: /straße|street/i });
  await streetInput.fill('äé#&/ Test Straße');
  
  await expect(streetInput).toHaveValue('äé#&/ Test Straße');
});

test('EDGE-003 Quantity 0 handling', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);

  await page.getByRole('link', { name: /cart|warenkorb/i }).click();

  const qtyInput = page.locator('input[type="number"], input[name*="quantity"]').first();
  await qtyInput.fill('0');
  await qtyInput.press('Enter');

  // Assert system response: either product disappears, or an error toast updates the quantity status
  await expect(page.locator('body')).toContainText(/0|remove|invalid|leer|empty/i);
});

test('EDGE-004 Large quantity handling', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);

  const qtyInput = page.locator('input[type="number"], input[name*="quantity"]').first();
  await qtyInput.fill('9999');

  await addToCart(page);

  // Assert system enforces stock/quantity ceilings with a proper message
  await expect(page.locator('body')).toContainText(/limit|stock|error|maximum|verfügbar/i);
});

test('EDGE-005 Refresh browser during checkout', async ({ page }) => {
  await page.goto('/');
  await searchProduct(page, 'Aerodynamic');
  await openFirstProduct(page);
  await addToCart(page);
  await goToCheckout(page);
  await fillCheckout(page);

  // Trigger browser refresh mid-checkout
  await page.reload();

  // Assert session/cart integrity: user should remain in checkout and fields shouldn't crash the app
  await expect(page).toHaveURL(/checkout|register/i);
  await expect(page.getByRole('textbox', { name: /vorname|first name/i })).toBeVisible();
});