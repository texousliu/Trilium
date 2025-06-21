import { test, expect, _electron as electron, type ElectronApplication } from '@playwright/test';
import { join } from 'path';

let app: ElectronApplication;

test.beforeAll(async () => {
    const distPath = join(__dirname, '../../desktop/dist/main.cjs');
    app = await electron.launch({ args: [ distPath ] });
});

test.afterAll(async () => {
    try {
      const pid = app.process().pid;
      await app.close();

      if (pid) {
          // Double-check process is dead
          try {
            process.kill(pid, 0); // throws if process doesn't exist
            process.kill(pid, 'SIGKILL'); // force kill if still alive
          } catch (e) {
            // Process already dead
          }
      }
    } catch (err) {
      console.warn('Failed to close Electron app cleanly:', err);
    }
});

test('Electron app should display correct title', async () => {
  // Get the main window
  const window = await app.firstWindow();
  await expect(window).toHaveTitle("Setup");
});
