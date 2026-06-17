const serverless = require('serverless-http');
const app = require('../../app');

// Wrap the Express app for Serverless deployment
module.exports.handler = serverless(app);
