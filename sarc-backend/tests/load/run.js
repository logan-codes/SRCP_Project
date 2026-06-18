import { options } from './config.js';
import { runPublicFlow } from './public_flow.js';
import { runAuthFlow } from './auth_flow.js';

// Export configuration options from config.js
export { options };

// Central execution function for each k6 Virtual User iteration
export default function () {
    const vuId = __VU;
    
    // Randomly assign the VU to either Public Browsing (30% weight)
    // or Authenticated Student Actions (70% weight) to simulate parallel, mixed workload
    const roleSelector = Math.random();

    if (roleSelector < 0.3) {
        runPublicFlow();
    } else {
        runAuthFlow(vuId);
    }
}
