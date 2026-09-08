import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', timeout: 25000, fullyParallel: false, workers: 1,
  use: { baseURL: 'http://127.0.0.1:4322', viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', trace: 'retain-on-failure' },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4322', url: 'http://127.0.0.1:4322', reuseExistingServer: true },
});
