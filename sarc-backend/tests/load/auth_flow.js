import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';
import { generateTestStudent, registerUser, loginUser, logoutUser } from './helpers.js';

export function runAuthFlow(vuId) {
    // 1. Generate unique student details, register & log in
    const userPayload = generateTestStudent(vuId);
    
    const regOk = registerUser(userPayload);
    if (!regOk) return; // Terminate early if registration failed

    const tokens = loginUser(userPayload.email, userPayload.password);
    if (!tokens) return; // Terminate early if login failed

    const headers = {
        'Authorization': `Bearer ${tokens.token}`,
        'Content-Type': 'application/json'
    };

    // 2. Perform 3 randomized browsing iterations (simulates active session duration)
    for (let i = 0; i < 3; i++) {
        const rand = Math.floor(Math.random() * 100);

        if (rand < 40) {
            // Case A (40% weight): Student Dashboard view
            // Batch parallel requests just like StudentDashboard.jsx does
            const dashboardBatch = http.batch([
                ['GET', `${BASE_URL}/api/auth/me`, null, { headers }],
                ['GET', `${BASE_URL}/api/applications/student`, null, { headers }],
                ['GET', `${BASE_URL}/api/projects`, null, { headers }],
                ['GET', `${BASE_URL}/api/global-milestones`, null, { headers }]
            ]);

            check(dashboardBatch[0], { 'Auth Dashboard: /me status 200': (r) => r.status === 200 });
            check(dashboardBatch[1], { 'Auth Dashboard: /applications status 200': (r) => r.status === 200 });
            check(dashboardBatch[2], { 'Auth Dashboard: /projects status 200': (r) => r.status === 200 });
            check(dashboardBatch[3], { 'Auth Dashboard: /global-milestones status 200': (r) => r.status === 200 });

        } else if (rand < 70) {
            // Case B (30% weight): Browse Projects Page
            // Batch parallel requests like BrowseProjects.jsx does
            const projectsBatch = http.batch([
                ['GET', `${BASE_URL}/api/projects`, null, { headers }],
                ['GET', `${BASE_URL}/api/projects/ideas`, null, { headers }]
            ]);

            check(projectsBatch[0], { 'Auth Browse: /projects status 200': (r) => r.status === 200 });
            check(projectsBatch[1], { 'Auth Browse: /ideas status 200': (r) => r.status === 200 });

        } else if (rand < 90) {
            // Case C (20% weight): Guide Selection view
            // Batch parallel requests like GuideSelect.jsx does
            const guideBatch = http.batch([
                ['GET', `${BASE_URL}/api/guide/teams/my`, null, { headers }],
                ['GET', `${BASE_URL}/api/guide/faculty/available`, null, { headers }]
            ]);

            // Note: Since these routes check database state, they can occasionally return 400 or 404
            // if no team or config is found. That is acceptable application logic.
            // So we assert status code is 200 OR 400 (which is expected if no team is configured).
            check(guideBatch[0], { 'Auth Guide: /teams/my valid response': (r) => r.status === 200 || r.status === 400 || r.status === 404 });
            check(guideBatch[1], { 'Auth Guide: /faculty/available valid response': (r) => r.status === 200 || r.status === 400 || r.status === 403 });

        } else {
            // Case D (10% weight): Profile View & Edit
            const meRes = http.get(`${BASE_URL}/api/auth/me`, { headers });
            const meOk = check(meRes, { 'Auth Profile: /me status 200': (r) => r.status === 200 });

            if (meOk) {
                // Update profile
                const updateRes = http.put(
                    `${BASE_URL}/api/auth/profile`,
                    JSON.stringify({ bio: `Updated bio for VU ${vuId} on run ${i}` }),
                    { headers }
                );
                check(updateRes, { 'Auth Profile: update status 200': (r) => r.status === 200 });
            }
        }

        // Random sleep between 1 to 2.5 seconds to emulate user think time
        sleep(1.0 + Math.random() * 1.5);
    }

    // 3. Log out to clean up session
    logoutUser(tokens.token);
}
