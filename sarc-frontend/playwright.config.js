import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: '../tests/frontend/e2e',
    timeout: 30000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: false, // Run sequentially to prevent race conditions on the DB/caching
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1, // Single worker to avoid database race conditions with concurrent tests
    reporter: [['html', { open: 'never' }]],
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
