import { request } from '@playwright/test';

export const BACKEND_URL = 'http://localhost:5000';

/**
 * Programmatically register and login a user to bypass UI forms and speed up E2E tests.
 * Automatically completes first-time login activation (password change) to prevent E2E redirection.
 * @param {string} email
 * @param {string} password
 * @param {string} role STUDENT or FACULTY
 */
export async function authenticateUser(email, password, role = 'STUDENT') {
    const apiContext = await request.newContext();

    // 1. Register User
    const regRes = await apiContext.post(`${BACKEND_URL}/api/auth/register`, {
        data: {
            fullName: `E2E Test ${role}`,
            email,
            password,
            role
        }
    });

    // Accept 201 (success) or 400 (if user already exists from previous runs)
    if (regRes.status() !== 201 && regRes.status() !== 400) {
        const text = await regRes.text();
        throw new Error(`Registration failed: ${regRes.status()} - ${text}`);
    }

    // 2. Login User (gets initial token with isFirstLogin: true)
    let loginRes = await apiContext.post(`${BACKEND_URL}/api/auth/login`, {
        data: { email, password }
    });

    if (loginRes.status() !== 200) {
        const text = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status()} - ${text}`);
    }

    let loginData = await loginRes.json();

    // 3. Complete force-change-password if isFirstLogin is true to activate account
    if (loginData.user && loginData.user.isFirstLogin) {
        const changeRes = await apiContext.post(`${BACKEND_URL}/api/auth/force-change-password`, {
            headers: {
                'Authorization': `Bearer ${loginData.token}`
            },
            data: {
                newPassword: password,
                confirmPassword: password
            }
        });

        if (changeRes.status() !== 200) {
            const text = await changeRes.text();
            throw new Error(`Failed to change first-login password: ${changeRes.status()} - ${text}`);
        }

        // Re-login to get active session token with isFirstLogin: false
        loginRes = await apiContext.post(`${BACKEND_URL}/api/auth/login`, {
            data: { email, password }
        });

        if (loginRes.status() !== 200) {
            const text = await loginRes.text();
            throw new Error(`Re-login failed: ${loginRes.status()} - ${text}`);
        }

        loginData = await loginRes.json();
    }

    await apiContext.dispose();

    return {
        token: loginData.token,
        refreshToken: loginData.refreshToken,
        user: loginData.user
    };
}

/**
 * Create a mock project in the DB using the faculty's token
 * @param {string} facultyToken
 * @param {string} title
 */
export async function createTestProject(facultyToken, title = 'E2E Testing Project') {
    const apiContext = await request.newContext();
    const res = await apiContext.post(`${BACKEND_URL}/api/projects`, {
        headers: {
            'Authorization': `Bearer ${facultyToken}`
        },
        data: {
            title,
            description: 'This is a mock project created by E2E test scripts.',
            skillsRequired: ['Javascript', 'Playwright', 'NodeJS'],
            domain: 'Web Testing',
            technologies: ['Vite', 'React'],
            expectedOutcome: 'A complete E2E testing suite',
            numberOfStudents: '3',
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
    });

    if (res.status() !== 201) {
        const text = await res.text();
        throw new Error(`Failed to create test project: ${res.status()} - ${text}`);
    }

    const data = await res.json();
    await apiContext.dispose();
    return data;
}

/**
 * Seed localStorage to bypass the login page.
 * @param {import('@playwright/test').Page} page
 * @param {string} token
 * @param {string} role
 */
export async function seedAuthSession(page, token, role) {
    await page.goto('/');
    await page.evaluate(({ token, role }) => {
        localStorage.setItem('sarc_token', token);
        localStorage.setItem('sarc_role', role);
        localStorage.setItem('sarc_isFirstLogin', 'false');
    }, { token, role });
}
