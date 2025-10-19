// server/tests/teardown.js
const { pgp } = require('../src/config/db');

module.exports = async () => {
  console.log('Tearing down...');
  if (pgp) {
    pgp.end();
  }
};
