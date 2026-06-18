import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';
import { authenticateUser, seedAuthSession } from './helpers';

test.describe('Authentication and Authorization E2E Tests', () => {
    const testEmail = `e2e-auth-${Date.now()}@sathyabama.ac.in`;
    const testPassword = 'Password123!';

    // Pre-create the user via API so we can log in via UI
    test.beforeAll(async () => {
        await authenticateUser(testEmail, testPassword, 'STUDENT');
    });

    test('UI Login with valid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await loginPage.login(testEmail, testPassword);

        // Verify redirect to Student Dashboard
        await expect(page).toHaveURL(/.*\/student/);
        await expect(page.locator('h1')).toContainText('Student Dashboard');
    });

    test('UI Login with invalid credentials shows error', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        await loginPage.login(testEmail, 'WrongPassword123!');

        // Check error message
        const errMsg = await loginPage.getErrorMessage();
        expect(errMsg).toMatch(/Invalid default password|credentials/i);
    });

    test('Programmatic authentication bypasses login form', async ({ page }) => {
        const { token } = await authenticateUser(
            `e2e-programmatic-${Date.now()}@sathyabama.ac.in`,
            testPassword,
            'STUDENT'
        );

        await seedAuthSession(page, token, 'STUDENT');

        // Go directly to student dashboard, should load without redirecting to login
        await page.goto('/student');
        await expect(page).toHaveURL(/.*\/student/);
        await expect(page.locator('h1')).toContainText('Student Dashboard');
    });
});
