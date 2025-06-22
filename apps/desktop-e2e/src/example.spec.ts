import { test, expect, _electron as electron, type ElectronApplication } from '@playwright/test';
import { join } from 'path';

let app: ElectronApplication;

test.beforeAll(async () => {
    const distPath = join(__dirname, '../../desktop/dist/main.cjs');
    console.log("Dir", join(__dirname, 'traces'));
    app = await electron.launch({
        args: [ distPath ]
    });
});

test.afterAll(async () => {
    await app.close();
});

test('First setup', async () => {
  // Get the main window
  const setupWindow = await app.firstWindow();
  await expect(setupWindow).toHaveTitle("Setup");
  await expect(setupWindow.locator('h1')).toHaveText("Trilium Notes setup");
  await setupWindow.locator(`input[type="radio"]`).first().click();

  // Wait for the finish.
  const newWindowPromise = app.waitForEvent('window');
  await setupWindow.locator(`button[type="submit"]`, { hasText: "Next" }).click();

  const mainWindow = await newWindowPromise;
  await expect(mainWindow).toHaveTitle("Trilium Notes");
});
