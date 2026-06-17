const http = require('http');

const BASE = 'http://localhost:5000';
let adminToken = '';
let studentToken = '';
let results = [];

// ─── HTTP helper ───────────────────────────────────────────────────────────
function req(method, path, body, token) {
    return new Promise((resolve) => {
        const payload = body ? JSON.stringify(body) : null;
        const options = {
            method,
            hostname: 'localhost',
            port: 5000,
            path,
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
            }
        };
        const r = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        r.on('error', (e) => resolve({ status: 0, body: { message: e.message } }));
        if (payload) r.write(payload);
        r.end();
    });
}

function log(group, name, expected, actual, body) {
    const pass = Array.isArray(expected) ? expected.includes(actual) : actual === expected;
    const icon = pass ? '✅' : '❌';
    const msg = `  ${icon} [${actual}] ${name}`;
    results.push({ group, name, pass, status: actual, expected, body });
    console.log(msg + (!pass ? `  ← expected ${expected}, body: ${JSON.stringify(body).slice(0, 120)}` : ''));
}

// ─── TESTS ─────────────────────────────────────────────────────────────────
async function run() {
    console.log('\n════════════════════════════════════════════');
    console.log('   SARCG API Health Check');
    console.log('════════════════════════════════════════════\n');

    // ── Root ──────────────────────────────────────────────────────────────
    console.log('📌 ROOT');
    let r = await req('GET', '/');
    log('ROOT', 'GET /', 200, r.status, r.body);

    // ── Public Stats ──────────────────────────────────────────────────────
    console.log('\n📌 STATS (public)');
    r = await req('GET', '/api/stats');
    log('STATS', 'GET /api/stats', 200, r.status, r.body);

    // ── Public Projects ───────────────────────────────────────────────────
    console.log('\n📌 PROJECTS (public)');
    r = await req('GET', '/api/projects');
    log('PROJECTS', 'GET /api/projects (public)', 200, r.status, r.body);

    r = await req('GET', '/api/projects/ideas');
    log('PROJECTS', 'GET /api/projects/ideas (public)', 200, r.status, r.body);

    // ── AUTH ─────────────────────────────────────────────────────────────
    console.log('\n📌 AUTH');

    // Login Admin
    r = await req('POST', '/api/auth/login', { email: 'admin@gmail.com', password: '123' });
    log('AUTH', 'POST /api/auth/login (admin)', 200, r.status, r.body);
    if (r.status === 200) adminToken = r.body.token;

    // Login Student
    r = await req('POST', '/api/auth/login', { email: 'phmuzammil05@gmail.com', password: '456' });
    log('AUTH', 'POST /api/auth/login (student)', 200, r.status, r.body);
    if (r.status === 200) studentToken = r.body.token;

    // Wrong password
    r = await req('POST', '/api/auth/login', { email: 'admin@gmail.com', password: 'wrongpassword' });
    log('AUTH', 'POST /api/auth/login (wrong password → 401)', 401, r.status, r.body);

    // GET /me
    r = await req('GET', '/api/auth/me', null, adminToken);
    log('AUTH', 'GET /api/auth/me (admin)', 200, r.status, r.body);

    r = await req('GET', '/api/auth/me', null, studentToken);
    log('AUTH', 'GET /api/auth/me (student)', 200, r.status, r.body);

    // No token
    r = await req('GET', '/api/auth/me');
    log('AUTH', 'GET /api/auth/me (no token → 401)', 401, r.status, r.body);

    // Forgot password (always 200 for security)
    r = await req('POST', '/api/auth/forgot-password', { email: 'admin@gmail.com' });
    log('AUTH', 'POST /api/auth/forgot-password', 200, r.status, r.body);

    // ── USERS ─────────────────────────────────────────────────────────────
    console.log('\n📌 USERS');

    r = await req('GET', '/api/users/faculty', null, adminToken);
    log('USERS', 'GET /api/users/faculty', 200, r.status, r.body);

    r = await req('GET', '/api/users/all', null, adminToken);
    log('USERS', 'GET /api/users/all (admin)', 200, r.status, r.body);

    r = await req('GET', '/api/users/all', null, studentToken);
    log('USERS', 'GET /api/users/all (student → 403)', 403, r.status, r.body);

    r = await req('GET', '/api/users/analytics', null, adminToken);
    log('USERS', 'GET /api/users/analytics (admin)', 200, r.status, r.body);

    // ── NOTIFICATIONS ─────────────────────────────────────────────────────
    console.log('\n📌 NOTIFICATIONS');

    r = await req('GET', '/api/notifications', null, adminToken);
    log('NOTIFICATIONS', 'GET /api/notifications (admin)', 200, r.status, r.body);

    r = await req('GET', '/api/notifications', null, studentToken);
    log('NOTIFICATIONS', 'GET /api/notifications (student)', 200, r.status, r.body);

    r = await req('GET', '/api/notifications');
    log('NOTIFICATIONS', 'GET /api/notifications (no token → 401)', 401, r.status, r.body);

    // ── APPLICATIONS ─────────────────────────────────────────────────────
    console.log('\n📌 APPLICATIONS');

    r = await req('GET', '/api/applications/student', null, studentToken);
    log('APPLICATIONS', 'GET /api/applications/student', 200, r.status, r.body);

    r = await req('GET', '/api/applications/faculty', null, adminToken);
    log('APPLICATIONS', 'GET /api/applications/faculty (admin→403)', 403, r.status, r.body);

    // ── TEAMS ─────────────────────────────────────────────────────────────
    console.log('\n📌 TEAMS');

    r = await req('GET', '/api/teams', null, adminToken);
    log('TEAMS', 'GET /api/teams', 200, r.status, r.body);

    // ── MILESTONES ────────────────────────────────────────────────────────
    console.log('\n📌 MILESTONES');

    r = await req('GET', '/api/milestones/project/1', null, adminToken);
    log('MILESTONES', 'GET /api/milestones/project/1', [200, 404], r.status, r.body);

    // ── GLOBAL MILESTONES ────────────────────────────────────────────────
    console.log('\n📌 GLOBAL MILESTONES');

    r = await req('GET', '/api/global-milestones', null, adminToken);
    log('GLOBAL-MILESTONES', 'GET /api/global-milestones', 200, r.status, r.body);

    r = await req('GET', '/api/global-milestones');
    log('GLOBAL-MILESTONES', 'GET /api/global-milestones (no token → 401)', 401, r.status, r.body);

    // ── GUIDE ─────────────────────────────────────────────────────────────
    console.log('\n📌 GUIDE');

    r = await req('GET', '/api/guide/dashboard', null, adminToken);
    log('GUIDE', 'GET /api/guide/dashboard (admin)', 200, r.status, r.body);

    r = await req('GET', '/api/guide/config', null, adminToken);
    log('GUIDE', 'GET /api/guide/config (admin)', 200, r.status, r.body);

    r = await req('GET', '/api/guide/admin/teams', null, adminToken);
    log('GUIDE', 'GET /api/guide/admin/teams (admin)', 200, r.status, r.body);

    r = await req('GET', '/api/guide/teams/my', null, studentToken);
    log('GUIDE', 'GET /api/guide/teams/my (student)', [200, 404], r.status, r.body);

    r = await req('GET', '/api/guide/faculty/available', null, studentToken);
    log('GUIDE', 'GET /api/guide/faculty/available (student)', 200, r.status, r.body);

    // ── SUMMARY ───────────────────────────────────────────────────────────
    const passed = results.filter(r => r.pass).length;
    const failed = results.filter(r => !r.pass).length;

    console.log('\n════════════════════════════════════════════');
    console.log(`   RESULTS: ${passed} passed  |  ${failed} failed`);
    console.log('════════════════════════════════════════════\n');

    if (failed > 0) {
        console.log('❌ FAILED ENDPOINTS:\n');
        results.filter(r => !r.pass).forEach(r => {
            console.log(`  • [${r.group}] ${r.name}`);
            console.log(`    Got ${r.status}, expected ${r.expected}`);
            console.log(`    Response: ${JSON.stringify(r.body).slice(0, 200)}\n`);
        });
    } else {
        console.log('🎉 All endpoints are working correctly!\n');
    }
}

run().catch(e => { console.error('Script error:', e.message); process.exit(1); });
