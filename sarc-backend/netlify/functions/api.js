const serverless = require('serverless-http');
const app = require('../../app');

// Wrap the Express app configuration to run inside Netlify serverless environment
module.exports.handler = serverless(app);
