# Shopware Guest Checkout Automation

Automated end-to-end test for guest checkout using Playwright.

## Scenario Covered

Guest user:
1. Opens storefront
2. Searches for a product
3. Adds product to cart
4. Proceeds to checkout
5. Completes checkout as guest
6. Selects "Cash on Delivery"
7. Confirms order successfully

---

# Tech Stack

- Playwright
- JavaScript (Node.js)

---

# Setup

## Install dependencies

```bash
npm install
```

## Install Playwright browsers
- if on incompatible os: docker run -it mcr.microsoft.com/playwright:focal

```bash
npx playwright install
```

---

# Run Tests

```bash
npx playwright test
```

Run headed mode:

```bash
npx playwright test --headed
```

---

# Target Environment

Tested against:

- https://demo.shopware.com

- https://www.shopware6-demo.development-s25.com/

---

# Assertions Included

- Homepage loaded
- Search results displayed
- Product page opened
- Product visible in cart
- Checkout form accepted valid data
- Cash on Delivery selected
- Order confirmation displayed
- Order number visible

---

# Improvements With More Time

- Implement Page Object Model fully
- Add reusable test data factory
- Add API mocking for stable test runs
- Improve selector strategy using dedicated test IDs
- Add screenshot/video reporting
- Add CI pipeline using GitHub Actions
- Add negative and edge case automation
- Add retry handling for flaky UI elements