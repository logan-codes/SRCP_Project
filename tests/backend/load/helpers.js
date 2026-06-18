import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL } from './config.js';

/**
 * Generate a unique email and payload for registering a test user.
 * @param {number} vuId Virtual User ID
 * @returns {object} Registration payload
 */
export function generateTestStudent(vuId) {
    const timestamp = Date.now();
    const uniqueEmail = `load-test-student-${vuId}-${timestamp}@sathyabama.ac.in`;
    return {
        fullName: `Load VU ${vuId}`,
        email: uniqueEmail,
        password: 'Password123!',
        role: 'STUDENT'
    };
}

/**
 * Register a user programmatically.
 * @param {object} userPayload User registration data
 * @returns {boolean} Success state
 */
export function registerUser(userPayload) {
    const res = http.post(`${BASE_URL}/api/auth/register`, JSON.stringify(userPayload), {
        headers: { 'Content-Type': 'application/json' }
    });

    const isSuccess = check(res, {
        'Register: status is 201': (r) => r.status === 201,
    });

    if (!isSuccess) {
        console.error(`Registration failed. Status: ${res.status}. Body: ${res.body}`);
    }

    return isSuccess;
}

/**
 * Log in a user.
 * @param {string} email
 * @param {string} password
 * @returns {object|null} { token, refreshToken } or null
 */
export function loginUser(email, password) {
    const res = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({ email, password }), {
        headers: { 'Content-Type': 'application/json' }
    });

    const success = check(res, {
        'Login: status is 200': (r) => r.status === 200,
        'Login: contains token': (r) => r.json('token') !== undefined,
    });

    if (!success) {
        console.error(`Login failed. Status: ${res.status}. Body: ${res.body}`);
        return null;
    }

    return {
        token: res.json('token'),
        refreshToken: res.json('refreshToken')
    };
}

/**
 * Log out a user to invalidate their session in DB/Redis.
 * @param {string} token Access Token
 */
export function logoutUser(token) {
    const res = http.post(`${BASE_URL}/api/auth/logout`, null, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    check(res, {
        'Logout: status is 200': (r) => r.status === 200,
    });
}
