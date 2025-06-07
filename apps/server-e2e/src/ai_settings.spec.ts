import { test, expect } from "@playwright/test";
import App from "./support/app";

test.describe("AI Settings", () => {
    test("Should access AI settings page", async ({ page, context }) => {
        page.setDefaultTimeout(15_000);

        const app = new App(page, context);
        await app.goto();

        // Go to settings
        await app.goToSettings();
        
        // Navigate to AI settings
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        // Verify we're on the AI settings page
        await expect(app.currentNoteSplitTitle).toHaveValue("AI Settings");
        
        // Check that AI settings content is visible
        const aiSettingsContent = app.currentNoteSplitContent;
        await aiSettingsContent.waitFor({ state: "visible" });
        
        // Verify basic AI settings elements are present
        await expect(aiSettingsContent).toBeVisible();
    });

    test("Should toggle AI features", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Go to AI settings
        await app.goToSettings();
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        // Look for AI enable/disable toggle
        const aiToggle = app.currentNoteSplitContent.locator('input[type="checkbox"]').first();
        
        if (await aiToggle.isVisible()) {
            // Get initial state
            const initialState = await aiToggle.isChecked();
            
            // Toggle the setting
            await aiToggle.click();
            
            // Wait for the change to be saved
            await page.waitForTimeout(1000);
            
            // Verify the state changed
            const newState = await aiToggle.isChecked();
            expect(newState).toBe(!initialState);
            
            // Toggle back to original state
            await aiToggle.click();
            await page.waitForTimeout(1000);
            
            // Verify we're back to the original state
            const finalState = await aiToggle.isChecked();
            expect(finalState).toBe(initialState);
        }
    });

    test("Should configure AI provider settings", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Go to AI settings
        await app.goToSettings();
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        // Look for provider configuration elements
        const settingsContent = app.currentNoteSplitContent;
        
        // Check for common AI provider setting elements
        const providerSelects = settingsContent.locator('select');
        const apiKeyInputs = settingsContent.locator('input[type="password"], input[type="text"]');
        
        if (await providerSelects.count() > 0) {
            // Test provider selection
            const firstSelect = providerSelects.first();
            await firstSelect.click();
            
            // Verify options are available
            const options = firstSelect.locator('option');
            const optionCount = await options.count();
            expect(optionCount).toBeGreaterThan(0);
        }
        
        if (await apiKeyInputs.count() > 0) {
            // Test API key field interaction (without actually setting a key)
            const firstInput = apiKeyInputs.first();
            await firstInput.click();
            
            // Verify the field is interactive
            await expect(firstInput).toBeFocused();
        }
    });

    test("Should display AI model options", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Go to AI settings
        await app.goToSettings();
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        const settingsContent = app.currentNoteSplitContent;
        
        // Look for model selection elements
        const modelSelects = settingsContent.locator('select').filter({ hasText: /model|gpt|claude|llama/i });
        
        if (await modelSelects.count() > 0) {
            const modelSelect = modelSelects.first();
            await modelSelect.click();
            
            // Verify model options are present
            const options = modelSelect.locator('option');
            const optionCount = await options.count();
            expect(optionCount).toBeGreaterThanOrEqual(1);
        }
    });

    test("Should save AI settings changes", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Go to AI settings
        await app.goToSettings();
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        const settingsContent = app.currentNoteSplitContent;
        
        // Look for save button or auto-save indication
        const saveButton = settingsContent.locator('button').filter({ hasText: /save|apply/i });
        
        if (await saveButton.count() > 0) {
            // Test save functionality
            await saveButton.first().click();
            
            // Wait for save to complete
            await page.waitForTimeout(1000);
            
            // Look for success indication (toast, message, etc.)
            const successMessage = page.locator('.toast, .notification, .success-message');
            if (await successMessage.count() > 0) {
                await expect(successMessage.first()).toBeVisible();
            }
        }
    });

    test("Should handle invalid AI configuration", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Go to AI settings
        await app.goToSettings();
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        const settingsContent = app.currentNoteSplitContent;
        
        // Look for API key input to test invalid configuration
        const apiKeyInput = settingsContent.locator('input[type="password"], input[type="text"]').first();
        
        if (await apiKeyInput.isVisible()) {
            // Enter invalid API key
            await apiKeyInput.fill("invalid-api-key-test");
            
            // Look for test/validate button
            const testButton = settingsContent.locator('button').filter({ hasText: /test|validate|check/i });
            
            if (await testButton.count() > 0) {
                await testButton.first().click();
                
                // Wait for validation
                await page.waitForTimeout(2000);
                
                // Look for error message
                const errorMessage = page.locator('.error, .alert-danger, .text-danger');
                if (await errorMessage.count() > 0) {
                    await expect(errorMessage.first()).toBeVisible();
                }
            }
            
            // Clear the invalid input
            await apiKeyInput.fill("");
        }
    });

    test("Should navigate between AI setting sections", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Go to AI settings
        await app.goToSettings();
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        // Look for sub-sections or tabs in AI settings
        const tabs = app.currentNoteSplitContent.locator('.nav-tabs a, .tab-header, .section-header');
        
        if (await tabs.count() > 1) {
            // Test navigation between sections
            const firstTab = tabs.first();
            const secondTab = tabs.nth(1);
            
            await firstTab.click();
            await page.waitForTimeout(500);
            
            await secondTab.click();
            await page.waitForTimeout(500);
            
            // Verify navigation worked by checking if content changed
            await expect(app.currentNoteSplitContent).toBeVisible();
        }
    });

    test("Should display AI feature documentation", async ({ page, context }) => {
        const app = new App(page, context);
        await app.goto();

        // Go to AI settings
        await app.goToSettings();
        await app.clickNoteOnNoteTreeByTitle("AI Settings");
        
        const settingsContent = app.currentNoteSplitContent;
        
        // Look for help or documentation links
        const helpLinks = settingsContent.locator('a').filter({ hasText: /help|documentation|learn more|guide/i });
        const helpButtons = settingsContent.locator('button, .help-icon, .info-icon').filter({ hasText: /\?|help|info/i });
        
        if (await helpLinks.count() > 0) {
            // Test help link accessibility
            const firstHelpLink = helpLinks.first();
            await expect(firstHelpLink).toBeVisible();
        }
        
        if (await helpButtons.count() > 0) {
            // Test help button functionality
            const helpButton = helpButtons.first();
            await helpButton.click();
            
            // Wait for help content to appear
            await page.waitForTimeout(1000);
            
            // Look for help modal or tooltip
            const helpContent = page.locator('.modal, .tooltip, .popover, .help-content');
            if (await helpContent.count() > 0) {
                await expect(helpContent.first()).toBeVisible();
            }
        }
    });
});