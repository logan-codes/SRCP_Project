import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL } from './config.js';

export function runPublicFlow() {
    // 1. Visit Landing Page (fetches stats)
    const statsRes = http.get(`${BASE_URL}/api/stats`);
    check(statsRes, {
        'Public: stats status is 200': (r) => r.status === 200,
        'Public: stats has correct keys': (r) => r.json('studentCollaborators') !== undefined,
    });

    sleep(1); // Simulate think time

    // 2. Browse active projects and ideas concurrently (simulating Promise.all in React)
    const batchRes = http.batch([
        ['GET', `${BASE_URL}/api/projects`, null, {}],
        ['GET', `${BASE_URL}/api/projects/ideas`, null, {}]
    ]);

    check(batchRes[0], {
        'Public: projects status is 200': (r) => r.status === 200,
        'Public: projects has array': (r) => r.json('projects') !== undefined,
    });

    check(batchRes[1], {
        'Public: ideas status is 200': (r) => r.status === 200,
        'Public: ideas has array': (r) => r.json('ideas') !== undefined,
    });

    // Logging Cache Hit vs Miss status (useful during test outputs)
    const cacheHeader = batchRes[0].headers['X-Cache'] || 'NONE';
    // We don't enforce X-Cache to be HIT on every request because the very first request
    // from a test run will be a MISS. But subsequent requests should see HIT.
}
