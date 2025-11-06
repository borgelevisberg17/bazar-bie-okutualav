// @ts-check

/** @type {import('@playwright/test').PlaywrightTestConfig} */
const config = {
  testDir: './tests',
  use: {
    baseURL: 'http://host.docker.internal',
  },
};

module.exports = config;
