// server/tests/setup.js
const dotenv = require('dotenv');
const path = require('path');
const { close } = require('../src/config/db');

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

// This will run once after all test suites
afterAll(async () => {
  await close();
});
