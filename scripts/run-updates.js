#!/usr/bin/env node

const fs = require('fs-extra');
const { run } = require('../lib/utils');
const config = require('../lib/config');
const ter = require('../lib/terminus');
const update = require('../lib/update');
const slack = require('../lib/slack');


// const test = () => run(`npx jest --color --ci=false --runInBand --no-watchman --config \
// ./node_modules/boostid/test_lib/jest.config.js`, false, {
//   env: {
//     JEST_PUPPETEER_CONFIG: './node_modules/boostid/test_lib/jest-puppeteer.config.js',
//   },
// });

(async () => {

  config.init();

  await update();

  await run(`./node_modules/boostid/scripts/run-tests.sh`);

  await ter.multidevMergeToDev('updates');

  await slack({ failed: false });
  
})()
.catch(async (err) => {
  console.error(err);

  let testResultsUrl;
  try {
    testResultsUrl = fs.readFileSync('/tmp/boostid_test_results', 'utf8').trim();
  } catch (_) {}

  await slack({ failed: true, testResultsUrl });

  process.exit(1);
});
