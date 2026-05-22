const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [
    ['html'],
    ['list']
  ],
  use: {
    baseURL: 'https://www.shopware6-demo.development-s25.com',
    headless: !process.env.HEADING_RUN, // Dynamically swaps based on script triggers
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
});