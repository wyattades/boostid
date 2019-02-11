#!/usr/bin/env node

const fs = require('fs-extra');
const { run } = require('../lib/utils');
const config = require('../lib/config');
const ter = require('../lib/terminus');
const update = require('../lib/update');
const slack = require('../lib/slack');
const log = require('../lib/log');


// const test = () => run(`npx jest --color --ci=false --runInBand --no-watchman --config \
// ./node_modules/boostid/test_lib/jest.config.js`, false, {
//   env: {
//     JEST_PUPPETEER_CONFIG: './node_modules/boostid/test_lib/jest-puppeteer.config.js',
//   },
// });

(async () => {

  config.init();

  const multidev = config.get('multidev');

  await update({ multidev });

  log.info('Running coverage tests');
  await run(`./node_modules/boostid/scripts/run-tests.sh`);

  log.info('Merging multidev to dev');
  await ter.multidevMergeToDev(multidev);

  await slack({ failed: false });
  
})()
.catch(async (err) => {
  log.error(err);

  let testResultsUrl;
  try {
    testResultsUrl = fs.readFileSync('/tmp/boostid_test_results', 'utf8').trim();
  } catch (_) { /**/ }

  await slack({ failed: true, testResultsUrl });

  throw '';
})
.catch(() => process.exit(1));
