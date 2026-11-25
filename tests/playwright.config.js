// Playwright configuration for the automated cases in tests/automation/.
//   cd tests && npx playwright test
// Each run writes one folder under tests/runs/ (gitignored): a summary, results.json, a
// screenshot for every verdict and Playwright's own recording of each failed case.
'use strict';
const path = require('path');
const { defineConfig } = require('@playwright/test');
const { runFolder } = require('./automation/support/run-folder.js');

// The port the suite's own server uses. Ports 8765, 8766 and 8771 are left for other local
// servers, so a run never collides with them.
// Set CARD_FINISHER_PORT when two runs must not share a server (several writers at once).
const PORT = Number(process.env.CARD_FINISHER_PORT) || 8770;
const root = path.resolve(__dirname, '..');
const runDir = runFolder(root);
// Set CARD_FINISHER_URL to run the cases against a deployed site (the UAT site or the live
// one) instead of the local files; the [disk] cases still use the local files.
const siteUrl = process.env.CARD_FINISHER_URL || '';

const PHONE = { width: 390, height: 844 };
const SMALL_PHONE = { width: 375, height: 667 };
const DESKTOP = { width: 1280, height: 800 };

// A case names where it runs in its title. The size: [phone], [desktop], [both], [small] or
// [disk]; adding [webkit] runs it in WebKit as well as Chromium. [all] is [both] with [webkit]. A case runs
// only where its verdict could differ: Chromium at phone size by default, the desktop size
// where the wide layout or a keyboard and mouse matter, WebKit where the engine could change
// the answer (layout, saved files, storage, the file input, the worker, gestures).
// Set CARD_FINISHER_FULL=1 to run every case in WebKit too, as before a release.
const isFullRun = process.env.CARD_FINISHER_FULL === '1';
const PHONE_CASES = /\[(all|phone|both)\]/;
const SMALL_CASES = /\[small\]/;
const DESKTOP_CASES = /\[(all|desktop|both)\]/;
const WEBKIT_PHONE_CASES = isFullRun
  ? PHONE_CASES
  : /\[all\]|(?=.*\[webkit\]).*\[(phone|both)\]/;
const WEBKIT_DESKTOP_CASES = isFullRun
  ? DESKTOP_CASES
  : /\[all\]|(?=.*\[webkit\]).*\[(desktop|both)\]/;
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
      grep: WEBKIT_PHONE_CASES,
      use: { browserName: 'webkit', ...phone(PHONE) },
    },
    {
      name: 'webkit-desktop',
      grep: WEBKIT_DESKTOP_CASES,
      use: { browserName: 'webkit', viewport: DESKTOP },
    },
    {
      name: 'chromium-disk',
      grep: DISK_CASES,
      use: { browserName: 'chromium', viewport: DESKTOP },
    },
  ],
});
