// Playwright configuration for the automated cases in tests/automation/.
//   cd tests && npx playwright test
// Each run writes one folder under tests/runs/ (gitignored): a summary, results.json, a
// screenshot for every verdict and Playwright's own recording of each failed case.
'use strict';
const path = require('path');
const { defineConfig } = require('@playwright/test');
const { runFolder } = require('./automation/support/run-folder.js');

// The port the suite's own server uses. The preview servers use 8766 and 8771, and Rich's
// LAN server 8765, so a run never collides with them.
const PORT = 8770;
const root = path.resolve(__dirname, '..');
const runDir = runFolder(root);
// Set CARD_FINISHER_URL to run the cases against a deployed site (the UAT site or the live
// one) instead of the local files; the [disk] cases still use the local files.
const siteUrl = process.env.CARD_FINISHER_URL || '';

const PHONE = { width: 390, height: 844 };
const SMALL_PHONE = { width: 375, height: 667 };
const DESKTOP = { width: 1280, height: 800 };

// A case names where it runs in its title: [all], [phone], [small], [desktop] or [disk].
const PHONE_CASES = /\[(all|phone)\]/;
const SMALL_CASES = /\[small\]/;
const DESKTOP_CASES = /\[(all|desktop)\]/;
const DISK_CASES = /\[disk\]/;

// A touch phone of the given size, at an iPhone's pixel density.
const phone = viewport => ({ viewport, hasTouch: true, deviceScaleFactor: 3 });

module.exports = defineConfig({
  testDir: './automation',
  testMatch: '**/*.spec.js',
  outputDir: path.join(runDir, 'traces'),
  fullyParallel: true,
  workers: 8,
  retries: 0,
  timeout: 60000,
  reporter: [
    ['list'],
    ['./automation/support/reporter.js'],
  ],
  use: {
    baseURL: siteUrl || `http://127.0.0.1:${PORT}/`,
    trace: 'retain-on-failure',
    acceptDownloads: true,
  },
  webServer: siteUrl ? undefined : {
    command: `node automation/support/serve.js ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: false,
  },
  projects: [
    {
      name: 'chromium-phone',
      grep: PHONE_CASES,
      use: { browserName: 'chromium', ...phone(PHONE) },
    },
    {
      name: 'chromium-small-phone',
      grep: SMALL_CASES,
      use: { browserName: 'chromium', ...phone(SMALL_PHONE) },
    },
    {
      name: 'chromium-desktop',
      grep: DESKTOP_CASES,
      use: { browserName: 'chromium', viewport: DESKTOP },
    },
    {
      name: 'webkit-phone',
      grep: PHONE_CASES,
      use: { browserName: 'webkit', ...phone(PHONE) },
    },
    {
      name: 'webkit-desktop',
      grep: DESKTOP_CASES,
      use: { browserName: 'webkit', viewport: DESKTOP },
    },
    {
      name: 'chromium-disk',
      grep: DISK_CASES,
      use: { browserName: 'chromium', viewport: DESKTOP },
    },
  ],
});
