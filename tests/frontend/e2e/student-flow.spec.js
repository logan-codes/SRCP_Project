import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectPage } from './pages/ProjectPage';
import { authenticateUser, createTestProject, seedAuthSession } from './helpers';

test.describe('Student User Journey E2E Tests', () => {
    let studentToken;
    let facultyToken;
    let mockProjectTitle;
    let testStudentEmail;
    let testFacultyEmail;
    const testPassword = 'Password123!';

    test.beforeAll(async () => {
        testStudentEmail = `e2e-student-${Date.now()}@sathyabama.ac.in`;
        testFacultyEmail = `e2e-faculty-${Date.now()}@sathyabama.ac.in`;
        mockProjectTitle = `E2E Auto Project ${Date.now()}`;

        // 1. Authenticate Faculty & create a project
        const facultyAuth = await authenticateUser(testFacultyEmail, testPassword, 'FACULTY');
        facultyToken = facultyAuth.token;
        await createTestProject(facultyToken, mockProjectTitle);

        // 2. Authenticate Student
        const studentAuth = await authenticateUser(testStudentEmail, testPassword, 'STUDENT');
        studentToken = studentAuth.token;
    });

    test('Student dashboard, project search, detail view, application, and logout flow', async ({ page }) => {
        const dashboardPage = new DashboardPage(page);
        const projectPage = new ProjectPage(page);

        // 1. Seed Student Session and load dashboard
        await seedAuthSession(page, studentToken, 'STUDENT');
        await page.goto('/student');

        // 2. Verify dashboard loaded successfully
        await expect(page).toHaveURL(/.*\/student/);
        await expect(page.locator('h1')).toContainText('Student Dashboard');

        // 3. Navigate to Browse Projects page
        await dashboardPage.clickSidebarLink('Browse Projects');
        await expect(page).toHaveURL(/.*\/projects/);

        // 4. Search for the mock project
        await projectPage.search(mockProjectTitle);

        // Assert the project card is visible
        const firstCard = projectPage.projectCards.first();
        await expect(firstCard.locator('h3')).toContainText(mockProjectTitle);

        // 5. Click Details to open project detail page
        await projectPage.clickProjectDetails(0);
        await expect(page).toHaveURL(/.*\/project\/\d+/);

        // Assert detail page loaded title
        await expect(page.locator('h1')).toContainText(mockProjectTitle);

        // 6. Click Apply for Research
        const applyButton = page.locator('button:has-text("Apply For Research")');
        await expect(applyButton).toBeVisible();
        await applyButton.click();

        // Fill out application message in the modal
        const messageInput = page.locator('textarea');
        await expect(messageInput).toBeVisible();
        await messageInput.fill('Hi, I am very passionate about E2E testing using Playwright. I would love to work on this research!');

        // Submit the application
        const submitButton = page.locator('button:has-text("Submit Application")');
        await submitButton.click();

        // 7. Assert success message is displayed
        const successMessage = page.locator('h3:has-text("Application Submitted!")');
        await expect(successMessage).toBeVisible();

        // Wait for modal to automatically close and page state update
        await page.waitForTimeout(2500);

        // Verify status has updated to PENDING on the detail page
        await expect(page.locator('text=PENDING')).toBeVisible();

        // 8. Sign out
        await page.goto('/student');
        await dashboardPage.logout();
    });
});
