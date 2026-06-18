import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { authenticateUser, seedAuthSession } from './helpers';

test.describe('Guide Selection Team E2E Tests', () => {
    let studentToken;
    let testStudentEmail;
    const testPassword = 'Password123!';

    test.beforeAll(async () => {
        testStudentEmail = `e2e-guide-student-${Date.now()}@sathyabama.ac.in`;

        // Register and login student
        const studentAuth = await authenticateUser(testStudentEmail, testPassword, 'STUDENT');
        studentToken = studentAuth.token;
    });

    test('Create, edit, and delete a project team', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);

        // 1. Seed session and go to guide selection page
        await seedAuthSession(page, studentToken, 'STUDENT');
        await page.goto('/guide/team/my');

        // Verify "No Team Found" state is displayed
        await expect(page.locator('h2')).toContainText('No Team Found');

        // 2. Click Create a Team
        const createTeamButton = page.locator('button:has-text("Create a Team")');
        await createTeamButton.click();
        await expect(page).toHaveURL(/.*\/guide\/team\/create/);

        // 3. Fill out team creation form
        const teamName = `E2E Team ${Date.now()}`;
        const projectTitle = `Smart E2E Analytics ${Date.now()}`;
        
        await page.locator('input[name="teamName"]').fill(teamName);
        await page.locator('input[name="projectTitle"]').fill(projectTitle);
        await page.locator('textarea[name="description"]').fill('Building automated E2E systems for test validation.');
        await page.locator('select[name="domain"]').selectOption('Web Development');

        // Submit form
        await page.locator('button:has-text("Create Team")').click();

        // 4. Assert team displays on My Team page
        await expect(page).toHaveURL(/.*\/guide\/team\/my/);
        await expect(page.locator('h1')).toContainText('My Team');
        await expect(page.locator('h3').first()).toContainText(teamName);
        await expect(page.locator('text=Web Development')).toBeVisible();

        // 5. Edit Team Details
        await page.locator('button:has-text("Edit Team")').click();
        await page.locator('input[value="' + teamName + '"]').fill(teamName + ' Updated');
        await page.locator('button:has-text("Save Changes")').click();

        // Verify edit is saved
        await expect(page.locator('h3').first()).toContainText(teamName + ' Updated');

        // 6. Delete Team
        // Handle confirm dialog automatically
        page.once('dialog', async dialog => {
            expect(dialog.message()).toContain('Are you sure you want to delete this team?');
            await dialog.accept();
        });

        // Trigger delete
        await page.locator('button:has-text("Delete Team")').click();

        // Verify we are back to "No Team Found" state
        await expect(page.locator('h2')).toContainText('No Team Found');
    });
});
