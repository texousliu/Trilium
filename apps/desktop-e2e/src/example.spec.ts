import { test, expect, _electron as electron } from '@playwright/test';
import { join } from 'path';

test('Electron app should display correct title', async () => {
  // Launch Electron app
  const distPath = join(__dirname, '../../desktop/dist/main.cjs');
  const app = await electron.launch({ args: [ distPath ] });

  // Get the main window
  const window = await app.firstWindow();
  await expect(window).toHaveTitle("Setup");
  await app.close();
});
