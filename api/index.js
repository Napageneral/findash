const serverless = require('serverless-http');
const app = require('../backend-example');

module.exports = (req, res) => {
  const handler = serverless(app);
  return handler(req, res);
};

