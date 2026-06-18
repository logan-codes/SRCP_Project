// k6 load test configuration profiles

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';

// Define different profiles based on MODE environment variable
const mode = __ENV.MODE || 'smoke';

let testOptions = {
    thresholds: {
        http_req_failed: ['rate<0.10'], // Allow up to 10% expected business 4xx codes (403/404)
        http_req_duration: ['p(95)<500'], // Allow up to 500ms for cold start remote database queries
    },
};

if (mode === 'smoke') {
    // Smoke Test: Validate scripts with minimal VUs
    testOptions.scenarios = {
        smoke: {
            executor: 'constant-vus',
            vus: 1,
            duration: '10s',
        }
    };
} else if (mode === 'load') {
    // Standard Load Test: Normal production traffic simulation
    testOptions.scenarios = {
        load_scenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 15 }, // Ramp up to 15 VUs
                { duration: '1m', target: 15 },  // Stay at 15 VUs
                { duration: '30s', target: 0 },  // Ramp down to 0
            ],
            gracefulRampDown: '5s',
        }
    };
} else if (mode === 'stress') {
    // Stress Test: Run to system limit
    testOptions.scenarios = {
        stress_scenario: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '30s', target: 50 },  // Ramp up to 50
                { duration: '1m', target: 50 },   // Stay at 50
                { duration: '30s', target: 100 },  // Spike to 100
                { duration: '1m', target: 100 },   // Stay at 100
                { duration: '30s', target: 0 },    // Ramp down to 0
            ],
            gracefulRampDown: '10s',
        }
    };
}

export const options = testOptions;
