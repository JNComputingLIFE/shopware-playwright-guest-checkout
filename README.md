# Shopware Guest Checkout Automation

Automated end-to-end test for guest checkout using Playwright.

# Shop Checkout E2E Test Suite

## Overview
This repository contains end-to-end tests for the checkout flow using Playwright.

The suite covers:
- Positive checkout flows
- Negative validation scenarios
- Edge cases for cart and checkout behavior

## Target Environment
- Application: Shopware Demo Store
- URL: https://www.shopware6-demo.development-s25.com
- Browser: Chromium (Playwright default)
- OS: Cross-platform (tested on a local Kali Linux dev environment, which could only run codegen)
- cross compatible setup (since old LTS Debian): mcr.microsoft.com/playwright:focal



# Setup

## Install dependencies

```bash
npm install
```

## Install Playwright browsers
- compatible setup: docker run -it mcr.microsoft.com/playwright:focal

```bash
npx playwright install
```

---

# Run Tests

```bash
npx playwright test
```

Run headed mode (unused in app):

```bash
npx playwright test --headed
```

-

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
- Add retry handling for flaky UI elements - this one is especially important for SPA

# What works, what doesn't
- My test cases are ready to cover all planned test doc
- Can troubleshoot easily as cases are separated as doc is (pos, neg, edge types)
- Separated into usable functions for reuse
- Full checkout flow passes (the guest checkout flow)
- Search test passes
- Form validation blocks pass
- The spec has poor data abstraction (relies on codegen to generate cases)
- Does not implement some automation that surpasses the convenience of manually testing first
 
## Steps Forward
- playwright codegen enables automated user flow code generation. However, ui and response changes show that it is possible to use a bot that can read off a testing plan. Then it should be able to put all manual testing flows by clicking in playwright code gen window. This is one way to improve quickly.
- The other way is to use the chromedevtools MCP. Using this method may be preferable for easier setup.
- If quick testing is of concern, maybe Selenium WebDriver enables simpler scripting experience/compatibility (note Debian LTS support from playwright was limited, thanks to headless browser deps.)
